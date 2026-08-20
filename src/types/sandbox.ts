import type { SandboxCategoryType } from "@/lib/sandbox/categories";

// Misma forma que tendrá una fila de la tabla `events` en Supabase:
// categoryId pasará a ser una foreign key, y started_at/ended_at ya son
// timestamps en formato ISO, listos para guardarse tal cual en Postgres.
export interface SandboxEvent {
  id: string;
  categoryId: string;
  categoria: string;
  tipo: SandboxCategoryType;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
}
