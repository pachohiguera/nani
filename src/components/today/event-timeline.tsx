"use client";

import { iconFor } from "@/lib/categories";
import { formatClockTime, formatDuration } from "@/lib/time";
import type { EventWithRelations } from "@/types/today";

interface EventTimelineProps {
  events: EventWithRelations[];
}

export function EventTimeline({ events }: EventTimelineProps) {
  if (events.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500">
        Todavía no hay eventos registrados hoy.
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-2">
      {events.map((event) => (
        <li
          key={event.id}
          className="flex items-center gap-3 rounded-2xl bg-zinc-900 px-4 py-3"
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
            style={{
              backgroundColor: event.event_categories?.color ?? "#3f3f46",
            }}
          >
            {event.event_categories ? iconFor(event.event_categories.icono) : "•"}
          </span>

          <div className="flex-1">
            <p className="text-sm font-semibold text-white">
              {event.event_categories?.nombre ?? "Evento"}
            </p>
            <p className="text-xs text-zinc-400">
              {formatClockTime(event.started_at)}
              {event.ended_at === null && event.event_categories?.tipo === "duracion"
                ? " · en curso"
                : event.duration_seconds != null
                ? ` · ${formatDuration(event.duration_seconds)}`
                : ""}
              {event.caregivers ? ` · ${event.caregivers.nombre_display}` : ""}
            </p>
          </div>

          <span className="text-xs text-zinc-600" title={event.origen === "voz" ? "Por voz" : "Por botón"}>
            {event.origen === "voz" ? "🎙️" : "👆"}
          </span>
        </li>
      ))}
    </ul>
  );
}
