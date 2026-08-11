"use client";

import { groupFor, iconFor } from "@/lib/categories";
import { formatDuration, formatRelative } from "@/lib/time";
import type { EventWithRelations } from "@/types/today";

interface SummaryCardsProps {
  events: EventWithRelations[];
  now: Date | null;
}

function findLatest(
  events: EventWithRelations[],
  group: "toma" | "sueno" | "panal"
) {
  return events.find(
    (event) =>
      event.event_categories && groupFor(event.event_categories.icono) === group
  );
}

function Card({
  title,
  event,
  now,
  emptyLabel,
  runningLabel,
}: {
  title: string;
  event?: EventWithRelations;
  now: Date | null;
  emptyLabel: string;
  runningLabel?: (event: EventWithRelations, now: Date) => string;
}) {
  const isRunning = event && event.ended_at === null && runningLabel;

  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-zinc-900 px-4 py-3">
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {title}
      </p>
      {!event ? (
        <p className="text-sm text-zinc-400">{emptyLabel}</p>
      ) : isRunning ? (
        <p className="text-sm font-semibold text-indigo-300">
          {now ? runningLabel(event, now) : "···"}
        </p>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-xl">
            {event.event_categories ? iconFor(event.event_categories.icono) : "•"}
          </span>
          <div>
            <p className="text-sm font-semibold text-white">
              {event.event_categories?.nombre}
            </p>
            <p className="text-xs text-zinc-400">
              {now ? formatRelative(event.ended_at ?? event.started_at, now) : "···"}
              {event.duration_seconds != null &&
                ` · ${formatDuration(event.duration_seconds)}`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function SummaryCards({ events, now }: SummaryCardsProps) {
  const lastFeed = findLatest(events, "toma");
  const lastSleep = findLatest(events, "sueno");
  const lastDiaper = findLatest(events, "panal");

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Card
        title="Última toma"
        event={lastFeed}
        now={now}
        emptyLabel="Sin registros hoy"
      />
      <Card
        title="Sueño"
        event={lastSleep}
        now={now}
        emptyLabel="Sin registros hoy"
        runningLabel={(event, now) => {
          const elapsed = Math.floor(
            (now.getTime() - new Date(event.started_at).getTime()) / 1000
          );
          return `Durmiendo ahora · ${formatDuration(elapsed)}`;
        }}
      />
      <Card
        title="Último pañal"
        event={lastDiaper}
        now={now}
        emptyLabel="Sin registros hoy"
      />
    </div>
  );
}
