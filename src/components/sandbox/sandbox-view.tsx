"use client";

import { useSandboxLog } from "@/hooks/use-sandbox-log";
import { SANDBOX_CATEGORIES } from "@/lib/sandbox/categories";
import { SandboxCategoryButton } from "@/components/sandbox/sandbox-category-button";
import { SandboxEventList } from "@/components/sandbox/sandbox-event-list";

export function SandboxView() {
  const { recentEvents, openByCategory, now, flashCategoryId, handlePress } = useSandboxLog();

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {SANDBOX_CATEGORIES.map((category) => (
          <SandboxCategoryButton
            key={category.id}
            category={category}
            openEvent={openByCategory[category.id]}
            now={now}
            flash={flashCategoryId === category.id}
            onPress={() => handlePress(category)}
          />
        ))}
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Últimos eventos
        </h2>
        <SandboxEventList events={recentEvents} />
      </div>
    </div>
  );
}
