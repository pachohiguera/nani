"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { events } from "@/lib/db/schema";
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

// Edición manual desde el historial: sobreescribe la duración total en
// minutos (reseteando el tiempo pausado, ya que el número que ingresa la
// persona ya es el total que quiere que quede guardado).
export async function updateEventDuration(eventId: string, minutes: number): Promise<RecordResult> {
  try {
    const [current] = await db.select().from(events).where(eq(events.id, eventId));
    if (!current) return { data: null, error: { message: "Evento no encontrado" } };

    const clampedMinutes = Math.max(0, Math.round(minutes));
    const endedAt = new Date(
      new Date(current.started_at).getTime() + clampedMinutes * 60_000
    ).toISOString();

    const [row] = await db
      .update(events)
      .set({ ended_at: endedAt, paused_seconds: 0, paused_at: null })
      .where(eq(events.id, eventId))
      .returning();
    return { data: row ?? null, error: row ? null : { message: "No se pudo actualizar" } };
  } catch (e) {
    return { data: null, error: { message: e instanceof Error ? e.message : "Error desconocido" } };
  }
}
