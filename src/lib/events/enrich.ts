import type { BabyEvent, EventCategory } from "@/types/database";
import type { EventWithRelations } from "@/types/today";

export function enrichEvent(
  row: BabyEvent,
  categories: EventCategory[],
  caregiverNamesById: Record<string, string>
): EventWithRelations {
  const category = categories.find((c) => c.id === row.category_id) ?? null;
  const caregiverName = caregiverNamesById[row.caregiver_id];

  return {
    ...row,
    event_categories: category
      ? {
          id: category.id,
          nombre: category.nombre,
          tipo: category.tipo,
          color: category.color,
          icono: category.icono,
        }
      : null,
    caregivers: caregiverName
      ? { id: row.caregiver_id, nombre_display: caregiverName }
      : null,
  };
}
