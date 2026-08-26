export type CategoryGroup = "toma" | "sueno" | "panal" | "otro";

const ICONS: Record<string, string> = {
  "breast-left": "🤱",
  "breast-right": "🤱",
  bottle: "🍼",
  droplet: "💧",
  diaper: "💩",
  "diaper-mix": "🧷",
  moon: "🌙",
  medicine: "💊",
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

const OPPOSITE_BREAST: Record<string, string> = {
  "breast-left": "breast-right",
  "breast-right": "breast-left",
};

// Para "cambiar de lado": dado el icono de un seno, el icono del otro seno.
// null para cualquier categoría que no sea un seno (sueño, biberón, etc.).
export function oppositeBreastIcono(icono: string): string | null {
  return OPPOSITE_BREAST[icono] ?? null;
}

// La categoría "Medicina" pide el nombre antes de registrar, a diferencia
// del resto de las instantáneas que se guardan directo al tocarlas.
export function isMedicine(icono: string): boolean {
  return icono === "medicine";
}
