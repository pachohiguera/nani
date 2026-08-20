export type SandboxCategoryType = "duracion" | "instantaneo";

export interface SandboxCategory {
  id: string;
  nombre: string;
  tipo: SandboxCategoryType;
  color: string;
  icono: string;
}

// Hardcodeadas para el sandbox. En la versión con Supabase esto pasa a ser
// una fila por categoría en la tabla `event_categories`.
export const SANDBOX_CATEGORIES: SandboxCategory[] = [
  { id: "seno-izquierdo", nombre: "Seno izquierdo", tipo: "duracion", color: "#ec4899", icono: "🤱" },
  { id: "seno-derecho", nombre: "Seno derecho", tipo: "duracion", color: "#f97316", icono: "🤱" },
  { id: "biberon", nombre: "Biberón", tipo: "duracion", color: "#3b82f6", icono: "🍼" },
  { id: "panal-pipi", nombre: "Pañal pipí", tipo: "instantaneo", color: "#eab308", icono: "💧" },
  { id: "panal-popo", nombre: "Pañal popó", tipo: "instantaneo", color: "#8b5cf6", icono: "💩" },
  { id: "panal-mix", nombre: "Pañal pipí y popó", tipo: "instantaneo", color: "#78716c", icono: "🧷" },
];
