"use client";

import { Fragment } from "react";
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
import {
  formatDayLabel,
  formatHourLabel,
  type DayTimeRanges,
  type TrendRange,
} from "@/lib/trends";

interface TimeRangeChartProps {
  title: string;
  data: DayTimeRanges[];
  range: TrendRange;
  color: string;
}

const ROW_HEIGHT = 28;
const HOUR_STEP = 4;
// Piso de ancho visible: una toma de 10 min sería un hilo de 1-2px en la
// escala de 24h+ y desaparecería — no afecta la hora mostrada en el tooltip,
// solo qué tan angosta se dibuja la barra.
const MIN_VISIBLE_HOURS = 0.15;

// Barras flotantes horizontales: cada sesión es un par de series apiladas
// — una invisible (0 → hora de inicio) que empuja la visible (inicio → fin)
// a su posición real en el eje de horas. Cada sesión necesita su propio
// stackId para no sumarse con las demás del mismo día.
function toFlatRow(point: DayTimeRanges): Record<string, number | string> {
  const row: Record<string, number | string> = { day: point.day };
  point.ranges.forEach((r, i) => {
    row[`offset${i}`] = r.startHour;
    row[`dur${i}`] = Math.max(r.endHour - r.startHour, MIN_VISIBLE_HOURS);
  });
  return row;
}

export function TimeRangeChart({ title, data, range, color }: TimeRangeChartProps) {
  const maxSlots = Math.max(1, ...data.map((d) => d.ranges.length));
  const maxEndHour = Math.max(24, ...data.flatMap((d) => d.ranges.map((r) => r.endHour)));
  const axisMax = Math.ceil(maxEndHour / HOUR_STEP) * HOUR_STEP;
  const ticks: number[] = [];
  for (let h = 0; h <= axisMax; h += HOUR_STEP) ticks.push(h);

  const flatData = data.map(toFlatRow);
  const height = Math.max(120, data.length * ROW_HEIGHT + 40);

  return (
    <div className="rounded-2xl bg-zinc-900 p-4">
      <h3 className="mb-3 text-sm font-semibold text-zinc-300">{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={flatData} layout="vertical" barCategoryGap="25%">
          <CartesianGrid horizontal={false} stroke={CHART_GRID} />
          <XAxis
            type="number"
            domain={[0, axisMax]}
            ticks={ticks}
            tickFormatter={(h: number) => formatHourLabel(h)}
            tick={{ fill: CHART_MUTED, fontSize: 11 }}
            axisLine={{ stroke: CHART_GRID }}
            tickLine={false}
          />
          <YAxis
            type="category"
            dataKey="day"
            tickFormatter={(day: string) => formatDayLabel(day, range)}
            tick={{ fill: CHART_MUTED, fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={56}
          />
          <Tooltip
            cursor={{ fill: "rgba(255,255,255,0.04)" }}
            content={({ active, payload, label }) => {
              const point = data.find((d) => d.day === label);
              return (
                <ChartTooltip
                  active={active && Boolean(payload?.length)}
                  title={formatDayLabel(String(label), range)}
                  rows={
                    point && point.ranges.length > 0
                      ? point.ranges.map((r, i) => ({
                          label: point.ranges.length > 1 ? `#${i + 1}` : title,
                          value: `${formatHourLabel(r.startHour)} – ${formatHourLabel(r.endHour)}`,
                          color,
                        }))
                      : []
                  }
                />
              );
            }}
          />
          {Array.from({ length: maxSlots }).map((_, i) => (
            <Fragment key={i}>
              <Bar dataKey={`offset${i}`} stackId={`slot${i}`} fill="transparent" isAnimationActive={false} />
              <Bar
                dataKey={`dur${i}`}
                stackId={`slot${i}`}
                fill={color}
                radius={4}
                maxBarSize={18}
                isAnimationActive={false}
              />
            </Fragment>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
