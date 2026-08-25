"use client";

import { iconFor, supportsPause } from "@/lib/categories";
import { formatSecondsClock } from "@/lib/time";
import type { EventCategory } from "@/types/database";
import type { EventWithRelations } from "@/types/today";

interface CategoryButtonProps {
  category: EventCategory;
  openEvent?: EventWithRelations;
  now: Date | null;
  flash: boolean;
  disabled?: boolean;
  onPress: () => void;
  onTogglePause?: () => void;
}

// Segundos "activos" transcurridos: descuenta el tiempo pausado, y si está
// pausado ahora mismo, congela el conteo en el instante en que se pausó (no
// sigue subiendo hasta que se reanude).
function activeElapsedSeconds(event: EventWithRelations, now: Date | null): number | null {
  const reference = event.paused_at ? new Date(event.paused_at) : now;
  if (!reference) return null;
  const totalSeconds = (reference.getTime() - new Date(event.started_at).getTime()) / 1000;
  return totalSeconds - event.paused_seconds;
}

export function CategoryButton({
  category,
  openEvent,
  now,
  flash,
  disabled,
  onPress,
  onTogglePause,
}: CategoryButtonProps) {
  const isDuration = category.tipo === "duracion";
  const isRunning = Boolean(openEvent);
  const isPausable = isDuration && supportsPause(category.icono);
  const isPaused = Boolean(openEvent?.paused_at);

  if (isRunning && isPausable && openEvent) {
    const seconds = activeElapsedSeconds(openEvent, now);
    return (
      <div
        style={{
          borderColor: category.color,
          backgroundColor: isPaused ? "transparent" : category.color,
        }}
        className="relative flex min-h-[104px] flex-col items-center justify-center gap-1 rounded-3xl border-2 px-2 py-3 text-center"
      >
        {!isPaused && (
          <span
            className="absolute right-3 top-3 h-2.5 w-2.5 animate-pulse rounded-full bg-white"
            aria-hidden
          />
        )}
        <span className="text-2xl">{iconFor(category.icono)}</span>
        <span
          className={`text-sm font-semibold ${isPaused ? "text-zinc-100" : "text-white"}`}
        >
          {category.nombre}
        </span>
        <span className={`text-xs ${isPaused ? "text-zinc-400" : "text-white/80"}`}>
          {seconds == null ? "···" : isPaused ? `En pausa · ${formatSecondsClock(seconds)}` : formatSecondsClock(seconds)}
        </span>
        <div className="mt-1 flex w-full gap-1.5">
          <button
            type="button"
            onClick={onTogglePause}
            disabled={disabled}
            className={`flex-1 rounded-xl py-1.5 text-xs font-semibold transition-transform active:scale-95 disabled:opacity-50 ${
              isPaused ? "bg-zinc-800 text-white" : "bg-white/20 text-white"
            }`}
          >
            {isPaused ? "▶ Reanudar" : "⏸ Pausar"}
          </button>
          <button
            type="button"
            onClick={onPress}
            disabled={disabled}
            className={`flex-1 rounded-xl py-1.5 text-xs font-semibold transition-transform active:scale-95 disabled:opacity-50 ${
              isPaused ? "bg-zinc-800 text-white" : "bg-white/20 text-white"
            }`}
          >
            ■ Parar
          </button>
        </div>
      </div>
    );
  }

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
        {isRunning && openEvent
          ? now
            ? formatSecondsClock((now.getTime() - new Date(openEvent.started_at).getTime()) / 1000)
            : "···"
          : isDuration
          ? "Toca para iniciar"
          : "Toca para registrar"}
      </span>
    </button>
  );
}
