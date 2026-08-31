"use client";

import { useState } from "react";
import { iconFor, supportsPause } from "@/lib/categories";
import {
  dayKey,
  dayLabel,
  formatClockTime,
  formatDuration,
  toTimeInputValue,
  withTimeOfDay,
} from "@/lib/time";
import {
  groupSessions,
  sessionDurationSeconds,
  sessionIsRunning,
  sessionLabel,
  sessionStartedAt,
  type EventSession,
} from "@/lib/events/sessions";
import type { EventWithRelations } from "@/types/today";

interface EventTimelineProps {
  events: EventWithRelations[];
  onEditDuration?: (
    sessionKey: string,
    minutes: number,
    startedAt?: string,
  ) => void;
  onEditTime?: (eventId: string, startedAt: string) => void;
  onDelete?: (sessionKey: string) => void;
}

interface DayGroup {
  key: string;
  label: string;
  sessions: EventSession[];
}

// Junta sesiones consecutivas del mismo día — `events` ya viene ordenado
// por started_at descendente, así que un día nunca queda partido en dos.
function groupByDay(sessions: EventSession[]): DayGroup[] {
  const groups: DayGroup[] = [];
  for (const session of sessions) {
    const startedAt = sessionStartedAt(session);
    const key = dayKey(startedAt);
    const current = groups[groups.length - 1];
    if (current && current.key === key) {
      current.sessions.push(session);
    } else {
      groups.push({ key, label: dayLabel(startedAt), sessions: [session] });
    }
  }
  return groups;
}

export function EventTimeline({
  events,
  onEditDuration,
  onEditTime,
  onDelete,
}: EventTimelineProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftMinutes, setDraftMinutes] = useState("");
  const [draftTime, setDraftTime] = useState("");

  const sessions = groupSessions(events);
  const dayGroups = groupByDay(sessions);

  if (sessions.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-zinc-500">
        Todavía no hay eventos registrados.
      </p>
    );
  }

  function startEditing(
    key: string,
    totalSeconds: number,
    startedAtIso: string,
  ) {
    setEditingId(key);
    setDraftMinutes(String(Math.round(totalSeconds / 60)));
    setDraftTime(toTimeInputValue(startedAtIso));
  }

  function cancelEditing() {
    setEditingId(null);
    setDraftMinutes("");
    setDraftTime("");
  }

  function saveEditing(key: string, originalStartedAtIso: string) {
    const minutes = Number(draftMinutes);
    if (Number.isFinite(minutes) && minutes >= 0) {
      const startedAt = draftTime
        ? withTimeOfDay(originalStartedAtIso, draftTime)
        : undefined;
      onEditDuration?.(key, minutes, startedAt);
    }
    cancelEditing();
  }

  function saveEditingTime(key: string, originalStartedAtIso: string) {
    if (draftTime) {
      onEditTime?.(key, withTimeOfDay(originalStartedAtIso, draftTime));
    }
    cancelEditing();
  }

  function handleDelete(key: string) {
    if (window.confirm("¿Eliminar este registro? No se puede deshacer.")) {
      onDelete?.(key);
    }
    cancelEditing();
  }

  return (
    <div className="flex flex-col gap-4">
      {dayGroups.map((group) => (
        <div key={group.key}>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            {group.label}
          </h3>
          <ul className="flex flex-col gap-2">
            {group.sessions.map((session) => {
              const lastEvent = session.events[session.events.length - 1];
              const category = lastEvent.event_categories;
              const running = sessionIsRunning(session);
              const totalSeconds = sessionDurationSeconds(session);

              // Editable (minutos + hora) solo para senos/sueño ya cerrados —
              // aunque haya cambio de lado, el número que se ingresa es el total
              // de la sesión (ver updateSessionDuration). Los instantáneos
              // (pañales, medicina) no tienen minutos que editar, pero sí se
              // pueden borrar por si fue un toque equivocado.
              const isDurationEditable =
                !running &&
                category !== null &&
                category.tipo === "duracion" &&
                supportsPause(category.icono);
              const isTimeEditable =
                category !== null && category.tipo === "instantaneo";
              const isDeletable =
                category !== null &&
                (category.tipo === "instantaneo" ||
                  (!running && category.tipo === "duracion"));
              const canManage =
                Boolean(onEditDuration || onEditTime || onDelete) &&
                isDeletable;
              const isEditing = editingId === session.key;

              return (
                <li
                  key={session.key}
                  className="flex items-center gap-3 rounded-2xl bg-zinc-900 px-4 py-3"
                >
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
                    style={{ backgroundColor: category?.color ?? "#3f3f46" }}
                  >
                    {category ? iconFor(category.icono) : "•"}
                  </div>

                  <div className="flex-1">
                    <p className="text-sm font-semibold text-white">
                      {sessionLabel(session) || "Evento"}
                      {lastEvent.notas ? `: ${lastEvent.notas}` : ""}
                    </p>
                    {isEditing ? (
                      <div className="mt-1 flex flex-col gap-1.5">
                        {isDurationEditable && (
                          <div className="flex items-center gap-2">
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
                            <span className="text-xs text-zinc-600">
                              empezó a las
                            </span>
                            <input
                              type="time"
                              value={draftTime}
                              onChange={(e) => setDraftTime(e.target.value)}
                              className="h-8 rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-sm text-white"
                            />
                          </div>
                        )}
                        {isTimeEditable && !isDurationEditable && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-zinc-600">hora</span>
                            <input
                              type="time"
                              autoFocus
                              value={draftTime}
                              onChange={(e) => setDraftTime(e.target.value)}
                              className="h-8 rounded-lg border border-zinc-700 bg-zinc-950 px-2 text-sm text-white"
                            />
                          </div>
                        )}
                        <div className="flex items-center gap-3">
                          {isDurationEditable && (
                            <button
                              type="button"
                              onClick={() =>
                                saveEditing(
                                  session.key,
                                  sessionStartedAt(session),
                                )
                              }
                              className="rounded-lg bg-indigo-500 px-2 py-1 text-xs font-semibold text-white active:bg-indigo-600"
                            >
                              Guardar
                            </button>
                          )}
                          {isTimeEditable && !isDurationEditable && (
                            <button
                              type="button"
                              onClick={() =>
                                saveEditingTime(
                                  session.key,
                                  sessionStartedAt(session),
                                )
                              }
                              className="rounded-lg bg-indigo-500 px-2 py-1 text-xs font-semibold text-white active:bg-indigo-600"
                            >
                              Guardar
                            </button>
                          )}
                          {onDelete && (
                            <button
                              type="button"
                              onClick={() => handleDelete(session.key)}
                              className="rounded-lg bg-red-950 px-2 py-1 text-xs font-semibold text-red-300 active:bg-red-900"
                            >
                              Eliminar
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={cancelEditing}
                            className="text-xs text-zinc-500"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-400">
                        {formatClockTime(sessionStartedAt(session))}
                        {running && category?.tipo === "duracion"
                          ? " · en curso"
                          : totalSeconds != null
                            ? ` · ${formatDuration(totalSeconds)}`
                            : ""}
                        {lastEvent.caregivers
                          ? ` · ${lastEvent.caregivers.nombre_display}`
                          : ""}
                      </p>
                    )}
                  </div>

                  {canManage && !isEditing && (
                    <button
                      type="button"
                      onClick={() =>
                        isDurationEditable || isTimeEditable
                          ? startEditing(
                              session.key,
                              totalSeconds ?? 0,
                              sessionStartedAt(session),
                            )
                          : setEditingId(session.key)
                      }
                      aria-label="Editar"
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-500 active:bg-zinc-800"
                    >
                      ⚙️
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
