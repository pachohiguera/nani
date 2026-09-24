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
import { CHART_GRID, CHART_MUTED } from "@/lib/chart-colors";
import { formatHourLabel, type HourlyPoint } from "@/lib/trends";

interface HourlyChartProps {
  title: string;
  data: HourlyPoint[];
  color: string;
}

export function HourlyChart({ title, data, color }: HourlyChartProps) {
  return (
    <div className="rounded-2xl bg-zinc-900 p-4">
      <h3 className="mb-3 text-sm font-semibold text-zinc-300">{title}</h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} barCategoryGap="10%">
          <CartesianGrid vertical={false} stroke={CHART_GRID} />
          <XAxis
            dataKey="hour"
            tickFormatter={(hour: number) => formatHourLabel(hour)}
            tick={{ fill: CHART_MUTED, fontSize: 11 }}
            axisLine={{ stroke: CHART_GRID }}
            tickLine={false}
            interval={2}
          />
          <YAxis
            tick={{ fill: CHART_MUTED, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={32}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            content={({ active, payload, label }) => {
              const point = payload?.[0]?.payload as HourlyPoint | undefined;
              return (
                <ChartTooltip
                  active={active}
                  title={`${formatHourLabel(Number(label))} – ${formatHourLabel(Number(label) + 1)}`}
                  rows={
                    point && point.minutes > 0
                      ? [{ label: title, value: `${point.minutes} min/día`, color }]
                      : []
                  }
                />
              );
            }}
          />
          <Bar dataKey="minutes" fill={color} radius={[4, 4, 0, 0]} maxBarSize={16} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
