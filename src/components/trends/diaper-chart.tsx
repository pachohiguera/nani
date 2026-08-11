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
import { formatDayLabel, type DiaperPoint, type TrendRange } from "@/lib/trends";

interface DiaperChartProps {
  data: DiaperPoint[];
  range: TrendRange;
}

const LEGEND = [
  { label: "Pipí", color: SERIES.blue },
  { label: "Popó", color: SERIES.orange },
];

export function DiaperChart({ data, range }: DiaperChartProps) {
  return (
    <div className="rounded-2xl bg-zinc-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-300">Pañales por día</h3>
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
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            content={({ active, payload, label }) => {
              const point = payload?.[0]?.payload as DiaperPoint | undefined;
              return (
                <ChartTooltip
                  active={active}
                  title={formatDayLabel(String(label), range)}
                  rows={
                    point
                      ? [
                          { label: "Pipí", value: `${point.pipi}`, color: SERIES.blue },
                          { label: "Popó", value: `${point.popo}`, color: SERIES.orange },
                        ]
                      : []
                  }
                />
              );
            }}
          />
          <Bar
            dataKey="pipi"
            stackId="diaper"
            fill={SERIES.blue}
            stroke={CHART_SURFACE}
            strokeWidth={2}
            maxBarSize={24}
          />
          <Bar
            dataKey="popo"
            stackId="diaper"
            fill={SERIES.orange}
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
