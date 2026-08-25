export type CategoryGroup = "toma" | "sueno" | "panal" | "otro";

const ICONS: Record<string, string> = {
  "breast-left": "🤱",
  "breast-right": "🤱",
  bottle: "🍼",
  droplet: "💧",
  diaper: "💩",
  "diaper-mix": "🧷",
  moon: "🌙",
};

const GROUPS: Record<string, CategoryGroup> = {
  "breast-left": "toma",
  "breast-right": "toma",
  bottle: "toma",
  droplet: "panal",
  diaper: "panal",
  "diaper-mix": "panal",
  moon: "sueno",
};

export function iconFor(icono: string): string {
  return ICONS[icono] ?? "•";
}

export function groupFor(icono: string): CategoryGroup {
  return GROUPS[icono] ?? "otro";
}

// Categorías donde tiene sentido pausar sin cerrar el evento: tomas de pecho
// (el bebé se puede soltar y volver a agarrar) y sueño (se puede despertar y
// volver a dormir). El biberón y los pañales no lo necesitan.
const PAUSABLE_ICONS = new Set(["breast-left", "breast-right", "moon"]);

export function supportsPause(icono: string): boolean {
  return PAUSABLE_ICONS.has(icono);
}
