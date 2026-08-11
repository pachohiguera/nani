"use client";

interface TooltipRow {
  label: string;
  value: string;
  color: string;
}

interface ChartTooltipProps {
  active?: boolean;
  title?: string;
  rows: TooltipRow[];
}

// Tooltip compartido: el valor es lo destacado, la etiqueta va secundaria
// (el lector ya sabe qué serie está mirando y quiere el número), con una
// pequeña marca de color por fila en vez de un cuadro relleno.
export function ChartTooltip({ active, title, rows }: ChartTooltipProps) {
  if (!active || rows.length === 0) return null;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs shadow-lg">
      {title && <p className="mb-1 font-medium text-zinc-400">{title}</p>}
      <div className="flex flex-col gap-1">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-2">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: row.color }}
            />
            <span className="text-zinc-400">{row.label}</span>
            <span className="ml-auto font-semibold text-white">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
