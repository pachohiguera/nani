"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ChartTooltip } from "@/components/trends/chart-tooltip";
import { ChartLegend } from "@/components/trends/chart-legend";
import { CHART_GRID, CHART_MUTED, CHART_SURFACE, SERIES } from "@/lib/chart-colors";
import { formatDayLabel, type FeedingPoint, type TrendRange } from "@/lib/trends";

interface FeedingChartProps {
  data: FeedingPoint[];
  range: TrendRange;
}

const LEGEND = [
  { label: "Seno izquierdo", color: SERIES.blue },
  { label: "Seno derecho", color: SERIES.orange },
  { label: "Biberón", color: SERIES.aqua },
];

export function FeedingChart({ data, range }: FeedingChartProps) {
  return (
    <div className="rounded-2xl bg-zinc-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-300">
          Tomas por día (minutos)
        </h3>
        <ChartLegend items={LEGEND} />
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} barCategoryGap="20%">
          <CartesianGrid vertical={false} stroke={CHART_GRID} />
          <XAxis
            dataKey="day"
            tickFormatter={(day: string) => formatDayLabel(day, range)}
            tick={{ fill: CHART_MUTED, fontSize: 11 }}
            axisLine={{ stroke: CHART_GRID }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: CHART_MUTED, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            content={({ active, payload, label }) => {
              const point = payload?.[0]?.payload as FeedingPoint | undefined;
              return (
                <ChartTooltip
                  active={active}
                  title={formatDayLabel(String(label), range)}
                  rows={
                    point
                      ? [
                          {
                            label: "Seno izquierdo",
                            value: `${point.breastLeft} min`,
                            color: SERIES.blue,
                          },
                          {
                            label: "Seno derecho",
                            value: `${point.breastRight} min`,
                            color: SERIES.orange,
                          },
                          {
                            label: "Biberón",
                            value: `${point.bottle} min`,
                            color: SERIES.aqua,
                          },
                          {
                            label: "Tomas",
                            value: `${point.count}`,
                            color: CHART_MUTED,
                          },
                        ]
                      : []
                  }
                />
              );
            }}
          />
          <Bar
            dataKey="breastLeft"
            stackId="feed"
            fill={SERIES.blue}
            stroke={CHART_SURFACE}
            strokeWidth={2}
            maxBarSize={24}
          />
          <Bar
            dataKey="breastRight"
            stackId="feed"
            fill={SERIES.orange}
            stroke={CHART_SURFACE}
            strokeWidth={2}
            maxBarSize={24}
          />
          <Bar
            dataKey="bottle"
            stackId="feed"
            fill={SERIES.aqua}
            stroke={CHART_SURFACE}
            strokeWidth={2}
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
