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
