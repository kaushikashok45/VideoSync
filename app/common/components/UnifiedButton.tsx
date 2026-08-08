import { useRef } from "react";
import type { UnifiedButtonProps } from "../contracts/Button";
import useButtonBehaviour from "../logic/useButtonBehaviour";

export default function UnifiedButton({
  buttonLabel,
  classList = "",
  onClick,
  onKeyPress,
}: UnifiedButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useButtonBehaviour({ buttonRef, onClick, onKeyPress });

  return (
    <button
      type="button"
      className={`inline-block border rounded-lg p-2 font-extrabold text-sm font-mono text-gray-800 border border-gray-200 border-b-2 border-b-gray-300 ${classList}`}
      ref={buttonRef}
    >
      {buttonLabel}
    </button>
  );
}
