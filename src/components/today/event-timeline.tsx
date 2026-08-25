"use client";

import { useState } from "react";
import { iconFor, supportsPause } from "@/lib/categories";
import { formatClockTime, formatDuration } from "@/lib/time";
import {
  groupSessions,
  sessionDurationSeconds,
  sessionIsRunning,
  sessionLabel,
  sessionStartedAt,
} from "@/lib/events/sessions";
import type { EventWithRelations } from "@/types/today";

interface EventTimelineProps {
  events: EventWithRelations[];
  onEditDuration?: (eventId: string, minutes: number) => void;
}

export function EventTimeline({ events, onEditDuration }: EventTimelineProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftMinutes, setDraftMinutes] = useState("");

  const sessions = groupSessions(events);

  if (sessions.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500">
        Todavía no hay eventos registrados hoy.
      </p>
    );
  }

  function startEditing(key: string, totalSeconds: number) {
    setEditingId(key);
    setDraftMinutes(String(Math.round(totalSeconds / 60)));
  }

  function cancelEditing() {
    setEditingId(null);
    setDraftMinutes("");
  }

  function saveEditing(key: string) {
    const minutes = Number(draftMinutes);
    if (Number.isFinite(minutes) && minutes >= 0) {
      onEditDuration?.(key, minutes);
    }
    setEditingId(null);
    setDraftMinutes("");
  }

  return (
    <ul className="flex flex-col gap-2">
      {sessions.map((session) => {
        const lastEvent = session.events[session.events.length - 1];
        const category = lastEvent.event_categories;
        // Editable incluso con cambio de lado: el número que se ingresa es
        // el total de la sesión, y solo se ajusta el último tramo para que
        // la suma dé eso (ver updateSessionDuration).
        const isEditable =
          Boolean(onEditDuration) &&
          lastEvent.ended_at !== null &&
          category !== null &&
          category.tipo === "duracion" &&
          supportsPause(category.icono);
        const isEditing = editingId === session.key;
        const running = sessionIsRunning(session);
        const totalSeconds = sessionDurationSeconds(session);

        return (
          <li
            key={session.key}
            className="flex items-center gap-3 rounded-2xl bg-zinc-900 px-4 py-3"
          >
            <button
              type="button"
              onClick={
                isEditable
                  ? () =>
                      isEditing
                        ? cancelEditing()
                        : startEditing(session.key, totalSeconds ?? 0)
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
                {sessionLabel(session) || "Evento"}
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
                    onClick={() => saveEditing(session.key)}
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
                  {formatClockTime(sessionStartedAt(session))}
                  {running && category?.tipo === "duracion"
                    ? " · en curso"
                    : totalSeconds != null
                    ? ` · ${formatDuration(totalSeconds)}`
                    : ""}
                  {lastEvent.caregivers ? ` · ${lastEvent.caregivers.nombre_display}` : ""}
                </p>
              )}
            </div>

            <span
              className="text-xs text-zinc-600"
              title={lastEvent.origen === "voz" ? "Por voz" : "Por botón"}
            >
              {lastEvent.origen === "voz" ? "🎙️" : "👆"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
