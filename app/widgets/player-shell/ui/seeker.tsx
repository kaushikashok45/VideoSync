export interface SeekerProps {
  currentTime: number;
  duration: number;
  disabled?: boolean;
  onSeek: (time: number) => void;
}

export default function Seeker({
  currentTime,
  duration,
  disabled = false,
  onSeek,
}: SeekerProps) {
  const max = duration > 0 ? duration : 0;
  const value = Math.min(currentTime, max);
  return (
    <input
      type="range"
      min={0}
      max={max}
      step={0.1}
      value={value}
      disabled={disabled}
      onChange={(event) => onSeek(Number(event.target.value))}
      aria-label="Seek"
      data-testid="seeker"
      className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-line-strong accent-brand"
    />
  );
}
