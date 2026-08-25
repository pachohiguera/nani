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

function summarizeGroup(
  events: EventWithRelations[],
  group: "toma" | "sueno" | "panal"
) {
  const groupEvents = events.filter(
    (event) => event.event_categories && groupFor(event.event_categories.icono) === group
  );
  const count = groupEvents.length;
  const totalSeconds = groupEvents.reduce(
    (sum, event) => sum + (event.duration_seconds ?? 0),
    0
  );
  return { count, totalSeconds };
}

function Card({
  title,
  event,
  now,
  emptyLabel,
  runningLabel,
  summary,
}: {
  title: string;
  event?: EventWithRelations;
  now: Date | null;
  emptyLabel: string;
  runningLabel?: (event: EventWithRelations, now: Date) => string;
  summary?: string;
}) {
  const isRunning = event && event.ended_at === null && runningLabel;

  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-zinc-900 px-4 py-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          {title}
        </p>
        {summary && (
          <p className="whitespace-nowrap text-xs font-medium text-zinc-500">{summary}</p>
        )}
      </div>
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

  const feedSummary = summarizeGroup(events, "toma");
  const sleepSummary = summarizeGroup(events, "sueno");
  const diaperSummary = summarizeGroup(events, "panal");

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Card
        title="Última toma"
        event={lastFeed}
        now={now}
        emptyLabel="Sin registros hoy"
        summary={
          feedSummary.count > 0
            ? `${feedSummary.count}x · ${formatDuration(feedSummary.totalSeconds)} hoy`
            : undefined
        }
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
        summary={
          sleepSummary.count > 0
            ? `${sleepSummary.count}x · ${formatDuration(sleepSummary.totalSeconds)} hoy`
            : undefined
        }
      />
      <Card
        title="Último pañal"
        event={lastDiaper}
        now={now}
        emptyLabel="Sin registros hoy"
        summary={diaperSummary.count > 0 ? `${diaperSummary.count}x hoy` : undefined}
      />
    </div>
  );
}
