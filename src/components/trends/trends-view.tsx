"use client";

import { useMemo, useState } from "react";
import { enrichEvent } from "@/lib/events/enrich";
import {
  aggregateDiapers,
  aggregateFeeding,
  aggregateFeedingHourly,
  aggregateSleep,
  aggregateSleepHourly,
  aggregateVomit,
  buildCurrentDayKeys,
  type TrendRange,
} from "@/lib/trends";
import { SERIES } from "@/lib/chart-colors";
import { RangeSelector } from "@/components/trends/range-selector";
import { SleepChart } from "@/components/trends/sleep-chart";
import { FeedingChart } from "@/components/trends/feeding-chart";
import { DiaperChart } from "@/components/trends/diaper-chart";
import { VomitChart } from "@/components/trends/vomit-chart";
import { HourlyChart } from "@/components/trends/hourly-chart";
import type { BabyEvent, EventCategory } from "@/types/database";

interface TrendsViewProps {
  categories: EventCategory[];
  events: BabyEvent[];
  caregiverNamesById: Record<string, string>;
}

export function TrendsView({
  categories,
  events,
  caregiverNamesById,
}: TrendsViewProps) {
  const [range, setRange] = useState<TrendRange>("semana");

  const enriched = useMemo(
    () => events.map((row) => enrichEvent(row, categories, caregiverNamesById)),
    [events, categories, caregiverNamesById]
  );

  const days = useMemo(() => buildCurrentDayKeys(range), [range]);

  const sleepData = useMemo(
    () => aggregateSleep(enriched, days),
    [enriched, days]
  );
  const sleepHourlyData = useMemo(
    () => aggregateSleepHourly(enriched, days),
    [enriched, days]
  );
  const feedingData = useMemo(
    () => aggregateFeeding(enriched, days),
    [enriched, days]
  );
  const feedingHourlyData = useMemo(
    () => aggregateFeedingHourly(enriched, days),
    [enriched, days]
  );
  const diaperData = useMemo(
    () => aggregateDiapers(enriched, days),
    [enriched, days]
  );
  const vomitData = useMemo(
    () => aggregateVomit(enriched, days),
    [enriched, days]
  );

  return (
    <div className="flex flex-col gap-4">
      <RangeSelector value={range} onChange={setRange} />
      <SleepChart data={sleepData} range={range} />
      <HourlyChart title="A qué hora duerme" data={sleepHourlyData} color={SERIES.blue} />
      <FeedingChart data={feedingData} range={range} />
      <HourlyChart title="A qué hora come" data={feedingHourlyData} color={SERIES.orange} />
      <DiaperChart data={diaperData} range={range} />
      <VomitChart data={vomitData} range={range} />
    </div>
  );
}
