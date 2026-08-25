import type { EventWithRelations } from "@/types/today";

// Una "sesión" es uno o más eventos que comparten session_id (ej. seno
// izquierdo seguido de derecho, enlazados por "Cambiar de lado"). La
// mayoría de los eventos son sesiones de un solo elemento — esto no cambia
// nada para ellos, solo junta los que sí están enlazados.
export interface EventSession {
  key: string;
  events: EventWithRelations[];
}

// Agrupa preservando el orden de aparición de `events` (se espera que venga
// ordenado por started_at descendente, como todaysEvents).
export function groupSessions(events: EventWithRelations[]): EventSession[] {
  const byKey = new Map<string, EventWithRelations[]>();
  const order: string[] = [];

  for (const event of events) {
    const key = event.session_id ?? event.id;
    if (!byKey.has(key)) {
      byKey.set(key, []);
      order.push(key);
    }
    byKey.get(key)!.push(event);
  }

  return order.map((key) => ({
    key,
    events: byKey
      .get(key)!
      .slice()
      .sort((a, b) => new Date(a.started_at).getTime() - new Date(b.started_at).getTime()),
  }));
}

export function sessionStartedAt(session: EventSession): string {
  return session.events[0].started_at;
}

// null si el último tramo de la sesión sigue abierto.
export function sessionEndedAt(session: EventSession): string | null {
  const last = session.events[session.events.length - 1];
  return last.ended_at;
}

export function sessionIsRunning(session: EventSession): boolean {
  return sessionEndedAt(session) === null;
}

// null si algún tramo todavía está corriendo (duración total indefinida).
export function sessionDurationSeconds(session: EventSession): number | null {
  if (sessionIsRunning(session)) return null;
  return session.events.reduce((sum, event) => sum + (event.duration_seconds ?? 0), 0);
}

// "Seno izquierdo" para una sesión de un solo lado, "Seno izquierdo → derecho"
// si hubo cambio de lado.
export function sessionLabel(session: EventSession): string {
  const names = session.events
    .map((event) => event.event_categories?.nombre)
    .filter((nombre, index, all): nombre is string => Boolean(nombre) && all.indexOf(nombre) === index);
  return names.join(" → ");
}
