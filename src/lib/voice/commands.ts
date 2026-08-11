import { normalizeSpeech } from "@/lib/voice/normalize";
import type { EventCategory } from "@/types/database";

const PHRASES = {
  "breast-left": ["seno izquierdo", "izquierdo", "teta izquierda"],
  "breast-right": ["seno derecho", "derecho", "teta derecha"],
  bottle: ["biberon", "botella"],
  "diaper-mix": ["pipi y popo", "chichi y popo", "los dos"],
  diaper: ["popo", "hizo popo"],
  droplet: ["pipi", "chichi", "hizo chichi", "hizo pipi"],
  sleepStart: ["se durmio", "empezo a dormir", "durmiendo"],
  sleepEnd: ["se desperto", "termino de dormir"],
  stop: ["termine", "para", "listo"],
} as const;

export type VoiceCommand =
  | { kind: "start-duration"; category: EventCategory }
  | { kind: "stop-category"; category: EventCategory }
  | { kind: "instant"; category: EventCategory }
  | { kind: "stop-latest" }
  | { kind: "none" };

function findCategory(categories: EventCategory[], icono: string) {
  return categories.find((c) => c.icono === icono) ?? null;
}

function matchesAny(text: string, phrases: readonly string[]): boolean {
  return phrases.some((phrase) => text.includes(phrase));
}

// El orden importa: las frases compuestas ("pipí y popó") y las de sueño
// deben chequearse antes que las frases sueltas ("pipí", "popó") con las
// que colisionan como substring.
export function matchVoiceCommand(
  transcript: string,
  categories: EventCategory[]
): VoiceCommand {
  const text = normalizeSpeech(transcript);

  if (matchesAny(text, PHRASES["diaper-mix"])) {
    const category = findCategory(categories, "diaper-mix");
    if (category) return { kind: "instant", category };
  }

  if (matchesAny(text, PHRASES.sleepEnd)) {
    const category = findCategory(categories, "moon");
    if (category) return { kind: "stop-category", category };
  }

  if (matchesAny(text, PHRASES.sleepStart)) {
    const category = findCategory(categories, "moon");
    if (category) return { kind: "start-duration", category };
  }

  if (matchesAny(text, PHRASES["breast-left"])) {
    const category = findCategory(categories, "breast-left");
    if (category) return { kind: "start-duration", category };
  }

  if (matchesAny(text, PHRASES["breast-right"])) {
    const category = findCategory(categories, "breast-right");
    if (category) return { kind: "start-duration", category };
  }

  if (matchesAny(text, PHRASES.bottle)) {
    const category = findCategory(categories, "bottle");
    if (category) return { kind: "start-duration", category };
  }

  if (matchesAny(text, PHRASES.diaper)) {
    const category = findCategory(categories, "diaper");
    if (category) return { kind: "instant", category };
  }

  if (matchesAny(text, PHRASES.droplet)) {
    const category = findCategory(categories, "droplet");
    if (category) return { kind: "instant", category };
  }

  if (matchesAny(text, PHRASES.stop)) {
    return { kind: "stop-latest" };
  }

  return { kind: "none" };
}

const WAKE_PHRASES = ["hey nani", "ey nani", "oye nani", "ok nani"];

// Modo manos libres: busca "Hey Nani" (con variantes comunes de
// mishearing) y devuelve el resto de la frase como comando. null si no
// se detectó la palabra de activación.
export function extractCommandAfterWakeWord(transcript: string): string | null {
  const text = normalizeSpeech(transcript);

  for (const wake of WAKE_PHRASES) {
    const idx = text.indexOf(wake);
    if (idx !== -1) {
      return text.slice(idx + wake.length).trim();
    }
  }

  return null;
}
