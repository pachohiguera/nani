interface LegendItem {
  label: string;
  color: string;
}

// Leyenda siempre presente para 2+ series: el canal de identidad
// confiable, para no depender de que el lector empareje colores solo.
export function ChartLegend({ items }: { items: LegendItem[] }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-xs text-zinc-400">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
