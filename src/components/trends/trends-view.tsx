"use client";

import { useMemo, useState } from "react";
import { enrichEvent } from "@/lib/events/enrich";
import {
  aggregateDiapers,
  aggregateFeeding,
  aggregateFeedingTimes,
  aggregateSleep,
  aggregateSleepTimes,
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
import { TimeRangeChart } from "@/components/trends/time-range-chart";
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
  const sleepTimesData = useMemo(
    () => aggregateSleepTimes(enriched, days),
    [enriched, days]
  );
  const feedingData = useMemo(
    () => aggregateFeeding(enriched, days),
    [enriched, days]
  );
  const feedingTimesData = useMemo(
    () => aggregateFeedingTimes(enriched, days),
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
      <TimeRangeChart
        title="Horario de sueño"
        data={sleepTimesData}
        range={range}
        color={SERIES.blue}
      />
      <FeedingChart data={feedingData} range={range} />
      <TimeRangeChart
        title="Horario de tomas"
        data={feedingTimesData}
        range={range}
        color={SERIES.orange}
      />
      <DiaperChart data={diaperData} range={range} />
      <VomitChart data={vomitData} range={range} />
    </div>
  );
}
