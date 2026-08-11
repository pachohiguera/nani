"use client";

import type { TrendRange } from "@/lib/trends";

const OPTIONS: { value: TrendRange; label: string }[] = [
  { value: "dia", label: "Día" },
  { value: "semana", label: "Semana" },
  { value: "mes", label: "Mes" },
];

interface RangeSelectorProps {
  value: TrendRange;
  onChange: (range: TrendRange) => void;
}

export function RangeSelector({ value, onChange }: RangeSelectorProps) {
  return (
    <div className="flex gap-1 rounded-full bg-zinc-900 p-1">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            value === option.value
              ? "bg-indigo-500 text-white"
              : "text-zinc-400"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
