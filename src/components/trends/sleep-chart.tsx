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
import { CHART_GRID, CHART_MUTED, SERIES } from "@/lib/chart-colors";
import { formatDayLabel, type SleepPoint, type TrendRange } from "@/lib/trends";

interface SleepChartProps {
  data: SleepPoint[];
  range: TrendRange;
}

export function SleepChart({ data, range }: SleepChartProps) {
  return (
    <div className="rounded-2xl bg-zinc-900 p-4">
      <h3 className="mb-3 text-sm font-semibold text-zinc-300">
        Horas de sueño por día
      </h3>
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
            content={({ active, payload, label }) => (
              <ChartTooltip
                active={active}
                title={formatDayLabel(String(label), range)}
                rows={
                  payload?.[0]
                    ? [
                        {
                          label: "Sueño",
                          value: `${payload[0].value} h`,
                          color: SERIES.blue,
                        },
                      ]
                    : []
                }
              />
            )}
          />
          <Bar
            dataKey="hours"
            fill={SERIES.blue}
            radius={[4, 4, 0, 0]}
            maxBarSize={24}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
