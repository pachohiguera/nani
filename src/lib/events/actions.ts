"use server";

import { and, desc, eq, gte, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
import { hoursAgoIso } from "@/lib/time";
import type { BabyEvent, EventCategory, EventOrigin } from "@/types/database";

interface RecordParams {
  babyId: string;
  caregiverId: string;
  category: Pick<EventCategory, "id" | "tipo">;
  origen: EventOrigin;
  openEventId?: string | null;
}

interface RecordResult {
  data: BabyEvent | null;
  error: { message: string } | null;
}

function elapsedSeconds(sinceIso: string): number {
  return Math.max(0, Math.floor((Date.now() - new Date(sinceIso).getTime()) / 1000));
}

// Si el evento estaba pausado, pliega ese tramo en paused_seconds antes de
// cerrarlo — así "Parar" nunca deja un paused_at colgado y la duración final
// (calculada por el trigger) ya descuenta el tiempo pausado.
async function foldPauseIfAny(eventId: string) {
  const [current] = await db.select().from(events).where(eq(events.id, eventId));
  if (!current?.paused_at) return current?.paused_seconds ?? 0;
  return current.paused_seconds + elapsedSeconds(current.paused_at);
}

// Botón y voz comparten esta lógica: categorías de duración arrancan un
// cronómetro si no hay uno abierto para esa categoría, o lo cierran si ya
// hay uno corriendo. Las instantáneas se registran de una sola vez.
// duration_seconds lo calcula el trigger de Postgres al cerrar el evento.
export async function recordCategoryEvent({
  babyId,
  caregiverId,
  category,
  origen,
  openEventId,
}: RecordParams): Promise<RecordResult> {
  try {
    if (category.tipo === "duracion" && openEventId) {
      const pausedSeconds = await foldPauseIfAny(openEventId);
      const [row] = await db
        .update(events)
        .set({ ended_at: new Date().toISOString(), paused_seconds: pausedSeconds, paused_at: null })
        .where(eq(events.id, openEventId))
        .returning();
      return { data: row ?? null, error: row ? null : { message: "Evento no encontrado" } };
    }

    const [row] = await db
      .insert(events)
      .values({
        baby_id: babyId,
        category_id: category.id,
        caregiver_id: caregiverId,
        origen,
      })
      .returning();
    return { data: row ?? null, error: row ? null : { message: "No se pudo insertar" } };
  } catch (e) {
    return { data: null, error: { message: e instanceof Error ? e.message : "Error desconocido" } };
  }
}

// Pausar/reanudar solo tiene sentido en eventos de duración todavía abiertos
// (senos y sueño); no cierran el evento, solo acumulan el tramo pausado.
export async function pauseEvent(eventId: string): Promise<RecordResult> {
  try {
    const [row] = await db
      .update(events)
      .set({ paused_at: new Date().toISOString() })
      .where(eq(events.id, eventId))
      .returning();
    return { data: row ?? null, error: row ? null : { message: "Evento no encontrado" } };
  } catch (e) {
    return { data: null, error: { message: e instanceof Error ? e.message : "Error desconocido" } };
  }
}

export async function resumeEvent(eventId: string): Promise<RecordResult> {
  try {
    const pausedSeconds = await foldPauseIfAny(eventId);
    const [row] = await db
      .update(events)
      .set({ paused_seconds: pausedSeconds, paused_at: null })
      .where(eq(events.id, eventId))
      .returning();
    return { data: row ?? null, error: row ? null : { message: "Evento no encontrado" } };
  } catch (e) {
    return { data: null, error: { message: e instanceof Error ? e.message : "Error desconocido" } };
  }
}

// Edición manual desde el historial: sobreescribe la duración TOTAL de la
// sesión en minutos (útil si se olvidó pausar/parar a tiempo). `sessionKey`
// es el session_id compartido si hubo cambio de lado, o el id del propio
// evento si es uno suelto — ambos casos quedan cubiertos por el mismo where.
// Los tramos anteriores al último quedan como están; el último se estira o
// encoge para que la suma dé exactamente los minutos ingresados.
export async function updateSessionDuration(sessionKey: string, minutes: number): Promise<RecordResult> {
  try {
    const rows = await db
      .select()
      .from(events)
      .where(or(eq(events.session_id, sessionKey), eq(events.id, sessionKey)))
      .orderBy(events.started_at);
    if (rows.length === 0) return { data: null, error: { message: "Evento no encontrado" } };

    const last = rows[rows.length - 1];
    const priorSeconds = rows
      .slice(0, -1)
      .reduce((sum, row) => sum + (row.duration_seconds ?? 0), 0);

    const totalSeconds = Math.max(0, Math.round(minutes) * 60);
    const lastSeconds = Math.max(0, totalSeconds - priorSeconds);
    const endedAt = new Date(new Date(last.started_at).getTime() + lastSeconds * 1000).toISOString();

    const [row] = await db
      .update(events)
      .set({ ended_at: endedAt, paused_seconds: 0, paused_at: null })
      .where(eq(events.id, last.id))
      .returning();
    return { data: row ?? null, error: row ? null : { message: "No se pudo actualizar" } };
  } catch (e) {
    return { data: null, error: { message: e instanceof Error ? e.message : "Error desconocido" } };
  }
}

interface SwitchSideParams {
  fromEventId: string;
  toCategoryId: string;
  caregiverId: string;
  origen: EventOrigin;
}

interface SwitchSideResult {
  data: { closed: BabyEvent; opened: BabyEvent } | null;
  error: { message: string } | null;
}

// "Cambiar de lado": cierra el evento del seno actual y abre el del otro,
// enlazados por session_id (el id del primer evento de la sesión) para que
// se puedan mostrar/sumar como una sola toma.
export async function switchBreastSide({
  fromEventId,
  toCategoryId,
  caregiverId,
  origen,
}: SwitchSideParams): Promise<SwitchSideResult> {
  try {
    const [current] = await db.select().from(events).where(eq(events.id, fromEventId));
    if (!current) return { data: null, error: { message: "Evento no encontrado" } };

    const pausedSeconds = current.paused_at
      ? current.paused_seconds + elapsedSeconds(current.paused_at)
      : current.paused_seconds;
    const sessionId = current.session_id ?? current.id;
    const nowIso = new Date().toISOString();

    const [closed] = await db
      .update(events)
      .set({ ended_at: nowIso, paused_seconds: pausedSeconds, paused_at: null, session_id: sessionId })
      .where(eq(events.id, fromEventId))
      .returning();

    const [opened] = await db
      .insert(events)
      .values({
        baby_id: current.baby_id,
        category_id: toCategoryId,
        caregiver_id: caregiverId,
        origen,
        session_id: sessionId,
      })
      .returning();

    if (!closed || !opened) {
      return { data: null, error: { message: "No se pudo cambiar de lado" } };
    }
    return { data: { closed, opened }, error: null };
  } catch (e) {
    return { data: null, error: { message: e instanceof Error ? e.message : "Error desconocido" } };
  }
}

// Usado por el polling del cliente para que los dos caregivers se vean entre
// sí sin refrescar (mismo alcance de 48h que carga la página al entrar).
export async function getRecentEvents(babyId: string): Promise<BabyEvent[]> {
  return db
    .select()
    .from(events)
    .where(and(eq(events.baby_id, babyId), gte(events.started_at, hoursAgoIso(48))))
    .orderBy(desc(events.started_at));
}
