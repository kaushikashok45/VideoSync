import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { prefersReducedMotion } from "./reduced-motion.ts";

export const EASING = {
  easeOutExpo: "cubic-bezier(0.16, 1, 0.3, 1)",
} as const;

const REDUCED_CROSSFADE_MS = 150;

export interface RevealOptions {
  delayMs?: number;
  durationMs?: number;
}

export interface RevealResult {
  revealed: boolean;
  style: CSSProperties;
}

function clampNonNegative(value: number): number {
  return Math.max(0, value);
}

export function revealStyle(
  delayMs = 0,
  durationMs = 400,
  reducedMotion = false,
): CSSProperties {
  const duration = reducedMotion
    ? REDUCED_CROSSFADE_MS
    : clampNonNegative(durationMs);
  return {
    animationDuration: `${duration}ms`,
    animationDelay: `${reducedMotion ? 0 : clampNonNegative(delayMs)}ms`,
    animationTimingFunction: EASING.easeOutExpo,
    animationFillMode: "backwards",
  };
}

export function useReveal(
  { delayMs = 0, durationMs = 400 }: RevealOptions = {},
): RevealResult {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(prefersReducedMotion());
  }, []);

  return {
    revealed: true,
    style: revealStyle(delayMs, durationMs, reducedMotion),
  };
}
