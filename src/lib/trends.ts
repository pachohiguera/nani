import { groupFor } from "@/lib/categories";
import type { EventWithRelations } from "@/types/today";

export type TrendRange = "dia" | "semana" | "mes";

const RANGE_DAYS: Record<TrendRange, number> = {
  dia: 1,
  semana: 7,
  mes: 30,
};

function dayKey(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function buildDayKeys(range: TrendRange, now: Date): string[] {
  const count = RANGE_DAYS[range];
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    keys.push(dayKey(d));
  }
  return keys;
}

export function buildCurrentDayKeys(range: TrendRange): string[] {
  return buildDayKeys(range, new Date());
}

export function formatDayLabel(key: string, range: TrendRange): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return range === "mes"
    ? date.toLocaleDateString("es", { day: "numeric", month: "short" })
    : date.toLocaleDateString("es", { weekday: "short", day: "numeric" });
}

export interface SleepPoint {
  day: string;
  hours: number;
}

export interface FeedingPoint {
  day: string;
  breastLeft: number;
  breastRight: number;
  bottle: number;
  count: number;
}

export interface DiaperPoint {
  day: string;
  pipi: number;
  popo: number;
}

export interface VomitPoint {
  day: string;
  poco: number;
  medio: number;
  mucho: number;
}

function eventDayKey(event: EventWithRelations): string {
  return dayKey(new Date(event.started_at));
}

export function aggregateSleep(
  events: EventWithRelations[],
  days: string[]
): SleepPoint[] {
  const totals = new Map<string, number>();
  for (const event of events) {
    if (
      event.event_categories?.icono !== "moon" ||
      event.duration_seconds == null
    ) {
      continue;
    }
    const key = eventDayKey(event);
    totals.set(key, (totals.get(key) ?? 0) + event.duration_seconds);
  }
  return days.map((day) => ({
    day,
    hours: Math.round(((totals.get(day) ?? 0) / 3600) * 10) / 10,
  }));
}

export function aggregateFeeding(
  events: EventWithRelations[],
  days: string[]
): FeedingPoint[] {
  const byDay = new Map<
    string,
    { breastLeft: number; breastRight: number; bottle: number; count: number }
  >();

  for (const event of events) {
    const icono = event.event_categories?.icono;
    if (
      !icono ||
      groupFor(icono) !== "toma" ||
      event.duration_seconds == null
    ) {
      continue;
    }
    const key = eventDayKey(event);
    const entry = byDay.get(key) ?? {
      breastLeft: 0,
      breastRight: 0,
      bottle: 0,
      count: 0,
    };
    const minutes = event.duration_seconds / 60;
    if (icono === "breast-left") entry.breastLeft += minutes;
    else if (icono === "breast-right") entry.breastRight += minutes;
    else if (icono === "bottle") entry.bottle += minutes;
    entry.count += 1;
    byDay.set(key, entry);
  }

  return days.map((day) => {
    const entry = byDay.get(day);
    return {
      day,
      breastLeft: Math.round((entry?.breastLeft ?? 0) * 10) / 10,
      breastRight: Math.round((entry?.breastRight ?? 0) * 10) / 10,
      bottle: Math.round((entry?.bottle ?? 0) * 10) / 10,
      count: entry?.count ?? 0,
    };
  });
}

export function aggregateDiapers(
  events: EventWithRelations[],
  days: string[]
): DiaperPoint[] {
  const byDay = new Map<string, { pipi: number; popo: number }>();

  for (const event of events) {
    const icono = event.event_categories?.icono;
    if (!icono || groupFor(icono) !== "panal") continue;

    const key = eventDayKey(event);
    const entry = byDay.get(key) ?? { pipi: 0, popo: 0 };
    if (icono === "droplet") entry.pipi += 1;
    else if (icono === "diaper") entry.popo += 1;
    else if (icono === "diaper-mix") {
      entry.pipi += 1;
      entry.popo += 1;
    }
    byDay.set(key, entry);
  }

  return days.map((day) => {
    const entry = byDay.get(day);
    return { day, pipi: entry?.pipi ?? 0, popo: entry?.popo ?? 0 };
  });
}

export function aggregateVomit(
  events: EventWithRelations[],
  days: string[]
): VomitPoint[] {
  const byDay = new Map<string, { poco: number; medio: number; mucho: number }>();

  for (const event of events) {
    if (event.event_categories?.icono !== "vomit") continue;

    const key = eventDayKey(event);
    const entry = byDay.get(key) ?? { poco: 0, medio: 0, mucho: 0 };
    if (event.notas === "Poco") entry.poco += 1;
    else if (event.notas === "Medio") entry.medio += 1;
    else if (event.notas === "Mucho") entry.mucho += 1;
    byDay.set(key, entry);
  }

  return days.map((day) => {
    const entry = byDay.get(day);
    return {
      day,
      poco: entry?.poco ?? 0,
      medio: entry?.medio ?? 0,
      mucho: entry?.mucho ?? 0,
    };
  });
}
