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
import { formatDayLabel, type VomitPoint, type TrendRange } from "@/lib/trends";

interface VomitChartProps {
  data: VomitPoint[];
  range: TrendRange;
}

const LEGEND = [
  { label: "Poco", color: SERIES.aqua },
  { label: "Medio", color: SERIES.blue },
  { label: "Mucho", color: SERIES.orange },
];

export function VomitChart({ data, range }: VomitChartProps) {
  return (
    <div className="rounded-2xl bg-zinc-900 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-zinc-300">Vómito por día</h3>
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
              const point = payload?.[0]?.payload as VomitPoint | undefined;
              return (
                <ChartTooltip
                  active={active}
                  title={formatDayLabel(String(label), range)}
                  rows={
                    point
                      ? [
                          { label: "Poco", value: `${point.poco}`, color: SERIES.aqua },
                          { label: "Medio", value: `${point.medio}`, color: SERIES.blue },
                          { label: "Mucho", value: `${point.mucho}`, color: SERIES.orange },
                          {
                            label: "Total",
                            value: `${point.poco + point.medio + point.mucho}`,
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
            dataKey="poco"
            stackId="vomit"
            fill={SERIES.aqua}
            stroke={CHART_SURFACE}
            strokeWidth={2}
            maxBarSize={24}
          />
          <Bar
            dataKey="medio"
            stackId="vomit"
            fill={SERIES.blue}
            stroke={CHART_SURFACE}
            strokeWidth={2}
            maxBarSize={24}
          />
          <Bar
            dataKey="mucho"
            stackId="vomit"
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
