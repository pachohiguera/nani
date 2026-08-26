"use client";

import { isMedicine, oppositeBreastIcono } from "@/lib/categories";
import { CategoryButton } from "@/components/today/category-button";
import { MedicineButton } from "@/components/today/medicine-button";
import type { EventCategory } from "@/types/database";
import type { EventWithRelations } from "@/types/today";

interface CategoryGridProps {
  categories: EventCategory[];
  openEventsByCategory: Map<string, EventWithRelations>;
  now: Date | null;
  flashCategoryId: string | null;
  pendingCategoryId: string | null;
  onPress: (category: EventCategory) => void;
  onTogglePause: (category: EventCategory) => void;
  onSwitchSide: (fromCategory: EventCategory, toCategory: EventCategory) => void;
  onRecordMedicine: (category: EventCategory, nombre: string) => void;
}

export function CategoryGrid({
  categories,
  openEventsByCategory,
  now,
  flashCategoryId,
  pendingCategoryId,
  onPress,
  onTogglePause,
  onSwitchSide,
  onRecordMedicine,
}: CategoryGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {categories.map((category) => {
        if (isMedicine(category.icono)) {
          return (
            <MedicineButton
              key={category.id}
              category={category}
              flash={flashCategoryId === category.id}
              disabled={pendingCategoryId === category.id}
              onSave={(nombre) => onRecordMedicine(category, nombre)}
            />
          );
        }

        const openEvent = openEventsByCategory.get(category.id);
        const oppositeIcono = oppositeBreastIcono(category.icono);
        const siblingCategory = oppositeIcono
          ? categories.find((c) => c.icono === oppositeIcono)
          : undefined;

        return (
          <CategoryButton
            key={category.id}
            category={category}
            openEvent={openEvent}
            now={now}
            flash={flashCategoryId === category.id}
            disabled={pendingCategoryId === category.id}
            onPress={() => onPress(category)}
            onTogglePause={() => onTogglePause(category)}
            onSwitchSide={
              siblingCategory ? () => onSwitchSide(category, siblingCategory) : undefined
            }
          />
        );
      })}
    </div>
  );
}
