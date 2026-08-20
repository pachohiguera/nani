import { formatClockTime, formatDuration } from "@/lib/time";
import type { SandboxEvent } from "@/types/sandbox";

interface SandboxEventListProps {
  events: SandboxEvent[];
}

export function SandboxEventList({ events }: SandboxEventListProps) {
  if (events.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        Todavía no hay eventos. Toca un botón de arriba para empezar.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {events.map((event) => (
        <li
          key={event.id}
          className="flex items-center justify-between rounded-2xl border border-zinc-800 px-4 py-3 text-sm"
        >
          <span className="font-medium text-zinc-100">{event.categoria}</span>
          <span className="text-zinc-500">{formatClockTime(event.started_at)}</span>
          <span className="text-zinc-400">
            {event.duration_seconds != null
              ? formatDuration(event.duration_seconds)
              : event.tipo === "duracion"
              ? "corriendo…"
              : "—"}
          </span>
        </li>
      ))}
    </ul>
  );
}
