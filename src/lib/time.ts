export function formatClockTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelative(iso: string, now: Date = new Date()): string {
  const diffMs = now.getTime() - new Date(iso).getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "justo ahora";
  if (diffMin < 60) return `hace ${diffMin} min`;

  const hours = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  if (hours < 24) {
    return mins > 0 ? `hace ${hours} h ${mins} min` : `hace ${hours} h`;
  }

  const days = Math.floor(hours / 24);
  return `hace ${days} d`;
}

export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) return `${hours} h ${mins} min`;
  if (mins > 0) return `${mins} min`;
  return `${secs} s`;
}

export function formatSecondsClock(totalSecondsInput: number): string {
  const totalSeconds = Math.max(0, Math.floor(totalSecondsInput));
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");

  return hours > 0
    ? `${hours}:${pad(mins)}:${pad(secs)}`
    : `${pad(mins)}:${pad(secs)}`;
}

export function formatElapsedClock(startedAtIso: string, now: Date): string {
  const totalSeconds = (now.getTime() - new Date(startedAtIso).getTime()) / 1000;
  return formatSecondsClock(totalSeconds);
}

export function hoursAgoIso(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

// Para el input <input type="time"> del editor de historial: "HH:MM" en
// hora local, y de vuelta a un ISO conservando el día del timestamp original
// (no soporta editar cruzando la medianoche, no hace falta para este uso).
export function toTimeInputValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function withTimeOfDay(originalIso: string, hhmm: string): string {
  const d = new Date(originalIso);
  const [hours, minutes] = hhmm.split(":").map(Number);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

export function startOfLocalDay(date: Date = new Date()): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}
