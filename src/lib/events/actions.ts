import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, EventCategory, EventOrigin } from "@/types/database";

type Client = SupabaseClient<Database>;

interface RecordParams {
  supabase: Client;
  babyId: string;
  caregiverId: string;
  category: Pick<EventCategory, "id" | "tipo">;
  origen: EventOrigin;
  openEventId?: string | null;
}

// Botón y voz comparten esta lógica: categorías de duración arrancan un
// cronómetro si no hay uno abierto para esa categoría, o lo cierran si ya
// hay uno corriendo. Las instantáneas se registran de una sola vez.
export async function recordCategoryEvent({
  supabase,
  babyId,
  caregiverId,
  category,
  origen,
  openEventId,
}: RecordParams) {
  if (category.tipo === "instantaneo") {
    return supabase
      .from("events")
      .insert({
        baby_id: babyId,
        category_id: category.id,
        caregiver_id: caregiverId,
        started_at: new Date().toISOString(),
        origen,
      })
      .select()
      .single();
  }

  if (openEventId) {
    return supabase
      .from("events")
      .update({ ended_at: new Date().toISOString() })
      .eq("id", openEventId)
      .select()
      .single();
  }

  return supabase
    .from("events")
    .insert({
      baby_id: babyId,
      category_id: category.id,
      caregiver_id: caregiverId,
      started_at: new Date().toISOString(),
      origen,
    })
    .select()
    .single();
}
