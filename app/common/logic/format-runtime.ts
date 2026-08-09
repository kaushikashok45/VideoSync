export function formatRuntime(seconds: number | null): string | null {
  if (seconds == null || !Number.isFinite(seconds) || seconds < 0) return null;
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const minuteLabel = minutes === 1 ? "min" : "mins";
  if (hours > 0 && minutes > 0) {
    return `${hours} hr ${minutes} ${minuteLabel}`;
  }
  if (hours > 0) return `${hours} hr`;
  return `${minutes} mins`;
}
