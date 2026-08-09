import { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "~/shared/ui-kit/reduced-motion.ts";

export function useIdleVisibility(idleMs: number): {
  visible: boolean;
  reveal: () => void;
} {
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotion = prefersReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    timerRef.current = globalThis.setTimeout(() => setVisible(false), idleMs);
    return () => {
      if (timerRef.current !== null) globalThis.clearTimeout(timerRef.current);
    };
  }, [idleMs, reducedMotion]);

  const reveal = () => {
    if (!visible) setVisible(true);
    if (timerRef.current !== null) globalThis.clearTimeout(timerRef.current);
    if (!reducedMotion) {
      timerRef.current = globalThis.setTimeout(() => setVisible(false), idleMs);
    }
  };

  return { visible, reveal };
}
