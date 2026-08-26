"use client";

import { groupFor, iconFor, type CategoryGroup } from "@/lib/categories";
import { formatDuration, formatRelative } from "@/lib/time";
import {
  groupSessions,
  sessionDurationSeconds,
  sessionEndedAt,
  sessionLabel,
  type EventSession,
} from "@/lib/events/sessions";
import type { EventWithRelations } from "@/types/today";

interface SummaryCardsProps {
  // Ventana amplia (últimas 48h) para encontrar la "última toma/sueño/pañal"
  // — esto no debe vaciarse a medianoche, sirve de referencia aunque haya
  // pasado a "ayer".
  events: EventWithRelations[];
  // Solo los de hoy, para los conteos "Nx · duración hoy".
  todaysEvents: EventWithRelations[];
  now: Date | null;
}

function sessionGroupOf(session: EventSession): CategoryGroup {
  const category = session.events[0].event_categories;
  return category ? groupFor(category.icono) : "otro";
}

function findLatestSession(sessions: EventSession[], group: "toma" | "sueno" | "panal") {
  return sessions.find((session) => sessionGroupOf(session) === group);
}

function summarizeSessionGroup(sessions: EventSession[], group: "toma" | "sueno" | "panal") {
  const matching = sessions.filter((session) => sessionGroupOf(session) === group);
  const count = matching.length;
  const totalSeconds = matching.reduce((sum, session) => sum + (sessionDurationSeconds(session) ?? 0), 0);
  return { count, totalSeconds };
}

function Card({
  title,
  session,
  now,
  emptyLabel,
  runningLabel,
  summary,
}: {
  title: string;
  session?: EventSession;
  now: Date | null;
  emptyLabel: string;
  runningLabel?: (event: EventWithRelations, now: Date) => string;
  summary?: string;
}) {
  const lastEvent = session?.events[session.events.length - 1];
  const isRunning = Boolean(session && lastEvent && lastEvent.ended_at === null && runningLabel);
  const totalSeconds = session ? sessionDurationSeconds(session) : null;

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
      {!session || !lastEvent ? (
        <p className="text-sm text-zinc-400">{emptyLabel}</p>
      ) : isRunning ? (
        <p className="text-sm font-semibold text-indigo-300">
          {now ? runningLabel!(lastEvent, now) : "···"}
        </p>
      ) : (
        <div className="flex items-center gap-2">
          <span className="text-xl">
            {lastEvent.event_categories ? iconFor(lastEvent.event_categories.icono) : "•"}
          </span>
          <div>
            <p className="text-sm font-semibold text-white">{sessionLabel(session)}</p>
            <p className="text-xs text-zinc-400">
              {now
                ? formatRelative(sessionEndedAt(session) ?? lastEvent.started_at, now)
                : "···"}
              {totalSeconds != null && ` · ${formatDuration(totalSeconds)}`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export function SummaryCards({ events, todaysEvents, now }: SummaryCardsProps) {
  const sessions = groupSessions(events);
  const todaySessions = groupSessions(todaysEvents);

  const lastFeed = findLatestSession(sessions, "toma");
  const lastSleep = findLatestSession(sessions, "sueno");
  const lastDiaper = findLatestSession(sessions, "panal");

  const feedSummary = summarizeSessionGroup(todaySessions, "toma");
  const sleepSummary = summarizeSessionGroup(todaySessions, "sueno");
  const diaperSummary = summarizeSessionGroup(todaySessions, "panal");

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Card
        title="Última toma"
        session={lastFeed}
        now={now}
        emptyLabel="Sin registros"
        summary={
          feedSummary.count > 0
            ? `${feedSummary.count}x · ${formatDuration(feedSummary.totalSeconds)} hoy`
            : undefined
        }
      />
      <Card
        title="Sueño"
        session={lastSleep}
        now={now}
        emptyLabel="Sin registros"
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
        session={lastDiaper}
        now={now}
        emptyLabel="Sin registros"
        summary={diaperSummary.count > 0 ? `${diaperSummary.count}x hoy` : undefined}
      />
    </div>
  );
}
