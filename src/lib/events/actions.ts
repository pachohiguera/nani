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
      const [row] = await db
        .update(events)
        .set({ ended_at: new Date().toISOString() })
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
