"use client";

import { formatElapsedClock } from "@/lib/time";
import type { SandboxCategory } from "@/lib/sandbox/categories";
import type { SandboxEvent } from "@/types/sandbox";

interface SandboxCategoryButtonProps {
  category: SandboxCategory;
  openEvent?: SandboxEvent;
  now: Date | null;
  flash: boolean;
  onPress: () => void;
}

export function SandboxCategoryButton({
  category,
  openEvent,
  now,
  flash,
  onPress,
}: SandboxCategoryButtonProps) {
  const isRunning = Boolean(openEvent);
  const isDuration = category.tipo === "duracion";

  return (
    <button
      type="button"
      onClick={onPress}
      style={{
        borderColor: category.color,
        backgroundColor: isRunning || flash ? category.color : "transparent",
      }}
      className={`relative flex min-h-[112px] flex-col items-center justify-center gap-1 rounded-3xl border-2 px-3 py-4 text-center transition-transform active:scale-95 ${
        flash ? "scale-105" : ""
      }`}
    >
      {isRunning && (
        <span
          className="absolute right-3 top-3 h-2.5 w-2.5 animate-pulse rounded-full bg-white"
          aria-hidden
        />
      )}
      <span className="text-3xl">{category.icono}</span>
      <span
        className={`text-sm font-semibold ${
          isRunning || flash ? "text-white" : "text-zinc-100"
        }`}
      >
        {category.nombre}
      </span>
      <span className={`text-xs ${isRunning || flash ? "text-white/80" : "text-zinc-500"}`}>
        {isRunning && openEvent
          ? now
            ? formatElapsedClock(openEvent.started_at, now)
            : "···"
          : flash
          ? "Guardado ✓"
          : isDuration
          ? "Toca para iniciar"
          : "Toca para registrar"}
      </span>
    </button>
  );
}
