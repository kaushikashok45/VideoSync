import { useEffect, useState } from "react";

export function useIdleVisibility(idleMs: number): {
  visible: boolean;
  reveal: () => void;
} {
  const [visible, setVisible] = useState(true);
  const [lastActivity, setLastActivity] = useState(() => Date.now());

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), idleMs);
    return () => clearTimeout(timer);
  }, [lastActivity, idleMs]);

  const reveal = () => {
    setVisible(true);
    setLastActivity(Date.now());
  };

  return { visible, reveal };
}
