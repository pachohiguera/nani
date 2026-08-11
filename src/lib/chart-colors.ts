// Paleta categórica validada (modo oscuro) contra el fondo de la app
// (zinc-950 ≈ #0d0d0d): node scripts/validate_palette.js con esos 3 slots
// pasa los 6 checks (banda de luminosidad, piso de croma, separación CVD
// ≥8 ΔE, piso de visión normal ≥15, contraste ≥3:1) tanto en pares
// adyacentes como all-pairs.
export const CHART_SURFACE = "#0d0d0d";
export const CHART_GRID = "#2c2c2a";
export const CHART_MUTED = "#898781";
export const CHART_TEXT_SECONDARY = "#c3c2b7";

export const SERIES = {
  blue: "#3987e5",
  orange: "#d95926",
  aqua: "#199e70",
} as const;
