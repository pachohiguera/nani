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

export function formatElapsedClock(startedAtIso: string, now: Date): string {
  const totalSeconds = Math.max(
    0,
    Math.floor((now.getTime() - new Date(startedAtIso).getTime()) / 1000)
  );
  const hours = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, "0");

  return hours > 0
    ? `${hours}:${pad(mins)}:${pad(secs)}`
    : `${pad(mins)}:${pad(secs)}`;
}

export function hoursAgoIso(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

export function startOfLocalDay(date: Date = new Date()): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}
