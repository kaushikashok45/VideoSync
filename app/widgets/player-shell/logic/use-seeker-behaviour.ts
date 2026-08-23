import { useEffect, useRef, useState } from "react";

function clamp(value: number, duration: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  if (!Number.isFinite(duration) || duration <= 0) return 0;
  return Math.min(value, duration);
}

export interface SeekerBehaviour {
  value: number;
  preview: (value: number) => void;
  commit: () => void;
}

export function useSeekerBehaviour(
  currentTime: number,
  duration: number,
  onCommit: (value: number) => void,
): SeekerBehaviour {
  const [value, setValue] = useState(() => clamp(currentTime, duration));
  const seekingRef = useRef(false);
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    if (!seekingRef.current) setValue(clamp(currentTime, duration));
  }, [currentTime, duration]);

  const preview = (next: number) => {
    seekingRef.current = true;
    const clamped = clamp(next, duration);
    valueRef.current = clamped;
    setValue(clamped);
  };

  const commit = () => {
    if (!seekingRef.current) return;
    seekingRef.current = false;
    onCommit(valueRef.current);
  };

  return { value, preview, commit };
}
