"use client";

import { useState } from "react";
import { iconFor, supportsPause } from "@/lib/categories";
import { formatClockTime, formatDuration } from "@/lib/time";
import type { EventWithRelations } from "@/types/today";

interface EventTimelineProps {
  events: EventWithRelations[];
  onEditDuration?: (eventId: string, minutes: number) => void;
}

export function EventTimeline({ events, onEditDuration }: EventTimelineProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftMinutes, setDraftMinutes] = useState("");

  if (events.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500">
        Todavía no hay eventos registrados hoy.
      </p>
    );
  }

  function startEditing(event: EventWithRelations) {
    setEditingId(event.id);
    setDraftMinutes(String(Math.round((event.duration_seconds ?? 0) / 60)));
  }

  function cancelEditing() {
    setEditingId(null);
    setDraftMinutes("");
  }

  function saveEditing(eventId: string) {
    const minutes = Number(draftMinutes);
    if (Number.isFinite(minutes) && minutes >= 0) {
      onEditDuration?.(eventId, minutes);
    }
    setEditingId(null);
    setDraftMinutes("");
  }

  return (
    <ul className="flex flex-col gap-2">
      {events.map((event) => {
        const category = event.event_categories;
        // Editable a mano solo para senos y sueño ya cerrados — son los que
        // se pueden pausar, y por lo tanto los más propensos a quedar con un
        // tiempo raro si alguien se olvida de pausar/reanudar.
        const isEditable =
          Boolean(onEditDuration) &&
          event.ended_at !== null &&
          category !== null &&
          category.tipo === "duracion" &&
          supportsPause(category.icono);
        const isEditing = editingId === event.id;

        return (
          <li
            key={event.id}
            className="flex items-center gap-3 rounded-2xl bg-zinc-900 px-4 py-3"
          >
            <button
              type="button"
              onClick={
                isEditable
                  ? () => (isEditing ? cancelEditing() : startEditing(event))
                  : undefined
              }
              disabled={!isEditable}
              aria-label={isEditable ? "Editar duración" : undefined}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg disabled:cursor-default"
              style={{
                backgroundColor: category?.color ?? "#3f3f46",
              }}
            >
              {category ? iconFor(category.icono) : "•"}
            </button>

            <div className="flex-1">
              <p className="text-sm font-semibold text-white">
                {category?.nombre ?? "Evento"}
              </p>
              {isEditing ? (
                <div className="mt-1 flex items-center gap-2">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    autoFocus
                    value={draftMinutes}
                    onChange={(e) => setDraftMinutes(e.target.value)}
                    className="h-8 w-16 rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-sm text-white"
                  />
                  <span className="text-xs text-zinc-500">min</span>
                  <button
                    type="button"
                    onClick={() => saveEditing(event.id)}
                    className="rounded-lg bg-indigo-500 px-2 py-1 text-xs font-semibold text-white active:bg-indigo-600"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={cancelEditing}
                    className="text-xs text-zinc-500"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <p className="text-xs text-zinc-400">
                  {formatClockTime(event.started_at)}
                  {event.ended_at === null && category?.tipo === "duracion"
                    ? " · en curso"
                    : event.duration_seconds != null
                    ? ` · ${formatDuration(event.duration_seconds)}`
                    : ""}
                  {event.caregivers ? ` · ${event.caregivers.nombre_display}` : ""}
                </p>
              )}
            </div>

            <span
              className="text-xs text-zinc-600"
              title={event.origen === "voz" ? "Por voz" : "Por botón"}
            >
              {event.origen === "voz" ? "🎙️" : "👆"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
