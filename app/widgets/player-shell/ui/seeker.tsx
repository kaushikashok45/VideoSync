const thumbStyles = `input[data-testid="seeker"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 9999px;
  background: #f85149;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
input[data-testid="seeker"]:hover::-webkit-slider-thumb {
  transform: scale(1.3);
}
input[data-testid="seeker"]::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border-radius: 9999px;
  border: 0;
  background: #f85149;
  cursor: pointer;
  transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
input[data-testid="seeker"]:hover::-moz-range-thumb {
  transform: scale(1.3);
}
@media (prefers-reduced-motion: reduce) {
  input[data-testid="seeker"]::-webkit-slider-thumb,
  input[data-testid="seeker"]::-moz-range-thumb,
  input[data-testid="seeker"]:hover::-webkit-slider-thumb,
  input[data-testid="seeker"]:hover::-moz-range-thumb {
    transition: none;
    transform: none;
  }
}`;

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
  const seekable = Number.isFinite(duration) && duration > 0;
  const max = seekable ? duration : 0;
  const value = Math.min(currentTime, max);
  const progress = seekable ? Math.min(100, (value / duration) * 100) : 0;
  return (
    <>
      <style>{thumbStyles}</style>
      <div
        data-testid="seeker-track"
        className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-line-strong"
      >
        <span
          data-testid="seeker-completed"
          aria-hidden="true"
          style={{ width: `${progress}%` }}
          className="absolute inset-y-0 left-0 bg-brand"
        />
        <input
          type="range"
          min={0}
          max={max}
          step={0.1}
          value={value}
          disabled={disabled || !seekable}
          onChange={(event) => onSeek(Number(event.target.value))}
          aria-label="Seek"
          data-testid="seeker"
          className="absolute inset-0 h-1.5 w-full cursor-pointer appearance-none bg-transparent accent-brand"
        />
      </div>
    </>
  );
}
