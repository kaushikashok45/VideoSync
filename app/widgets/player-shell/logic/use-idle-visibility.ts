import { useEffect, useState } from "react";
import { prefersReducedMotion } from "~/shared/ui-kit/reduced-motion.ts";

export function useIdleVisibility(idleMs: number): {
  visible: boolean;
  reveal: () => void;
} {
  const [visible, setVisible] = useState(true);
  const [lastActivity, setLastActivity] = useState(() => Date.now());
  const reducedMotion = prefersReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const timer = setTimeout(() => setVisible(false), idleMs);
    return () => clearTimeout(timer);
  }, [lastActivity, idleMs, reducedMotion]);

  const reveal = () => {
    setVisible(true);
    setLastActivity(Date.now());
  };

  return { visible, reveal };
}
