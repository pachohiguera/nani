import type { BabyEvent, Caregiver, EventCategory } from "@/types/database";

export type EventWithRelations = BabyEvent & {
  event_categories: Pick<
    EventCategory,
    "id" | "nombre" | "tipo" | "color" | "icono"
  > | null;
  caregivers: Pick<Caregiver, "id" | "nombre_display"> | null;
};
