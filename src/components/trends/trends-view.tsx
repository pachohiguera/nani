"use client";

import { useMemo, useState } from "react";
import { enrichEvent } from "@/lib/events/enrich";
import {
  aggregateDiapers,
  aggregateFeeding,
  aggregateSleep,
  buildCurrentDayKeys,
  type TrendRange,
} from "@/lib/trends";
import { RangeSelector } from "@/components/trends/range-selector";
import { SleepChart } from "@/components/trends/sleep-chart";
import { FeedingChart } from "@/components/trends/feeding-chart";
import { DiaperChart } from "@/components/trends/diaper-chart";
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
  const feedingData = useMemo(
    () => aggregateFeeding(enriched, days),
    [enriched, days]
  );
  const diaperData = useMemo(
    () => aggregateDiapers(enriched, days),
    [enriched, days]
  );

  return (
    <div className="flex flex-col gap-4">
      <RangeSelector value={range} onChange={setRange} />
      <SleepChart data={sleepData} range={range} />
      <FeedingChart data={feedingData} range={range} />
      <DiaperChart data={diaperData} range={range} />
    </div>
  );
}
