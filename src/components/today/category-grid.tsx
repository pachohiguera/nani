"use client";

import { CategoryButton } from "@/components/today/category-button";
import type { EventCategory } from "@/types/database";
import type { EventWithRelations } from "@/types/today";

interface CategoryGridProps {
  categories: EventCategory[];
  openEventsByCategory: Map<string, EventWithRelations>;
  now: Date | null;
  flashCategoryId: string | null;
  pendingCategoryId: string | null;
  onPress: (category: EventCategory) => void;
}

export function CategoryGrid({
  categories,
  openEventsByCategory,
  now,
  flashCategoryId,
  pendingCategoryId,
  onPress,
}: CategoryGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {categories.map((category) => {
        const openEvent = openEventsByCategory.get(category.id);
        return (
          <CategoryButton
            key={category.id}
            category={category}
            isRunning={Boolean(openEvent)}
            startedAt={openEvent?.started_at}
            now={now}
            flash={flashCategoryId === category.id}
            disabled={pendingCategoryId === category.id}
            onPress={() => onPress(category)}
          />
        );
      })}
    </div>
  );
}
