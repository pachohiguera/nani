"use client";

import { iconFor } from "@/lib/categories";
import { formatElapsedClock } from "@/lib/time";
import type { EventCategory } from "@/types/database";

interface CategoryButtonProps {
  category: EventCategory;
  isRunning: boolean;
  startedAt?: string;
  now: Date | null;
  flash: boolean;
  disabled?: boolean;
  onPress: () => void;
}

export function CategoryButton({
  category,
  isRunning,
  startedAt,
  now,
  flash,
  disabled,
  onPress,
}: CategoryButtonProps) {
  const isDuration = category.tipo === "duracion";

  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      style={{
        borderColor: category.color,
        backgroundColor: isRunning ? category.color : "transparent",
      }}
      className={`relative flex min-h-[104px] flex-col items-center justify-center gap-1 rounded-3xl border-2 px-3 py-4 text-center transition-transform active:scale-95 disabled:opacity-50 ${
        flash ? "scale-105" : ""
      }`}
    >
      {isRunning && (
        <span
          className="absolute right-3 top-3 h-2.5 w-2.5 animate-pulse rounded-full bg-white"
          aria-hidden
        />
      )}
      <span className="text-3xl">{iconFor(category.icono)}</span>
      <span
        className={`text-sm font-semibold ${
          isRunning ? "text-white" : "text-zinc-100"
        }`}
      >
        {category.nombre}
      </span>
      <span
        className={`text-xs ${isRunning ? "text-white/80" : "text-zinc-500"}`}
      >
        {isRunning && startedAt
          ? now
            ? formatElapsedClock(startedAt, now)
            : "···"
          : isDuration
          ? "Toca para iniciar"
          : "Toca para registrar"}
      </span>
    </button>
  );
}
