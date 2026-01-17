import { MutableRefObject, useRef } from "react";
import type { UnifiedButtonProps } from "../contracts/Button";
import useButtonBehaviour from "../logic/useButtonBehaviour";

export default function UnifiedButton({
  buttonLabel,
  classList = "",
  onClick,
  onKeyPress,
}: UnifiedButtonProps) {
  const buttonRef: MutableRefObject<HTMLButtonElement | null> = useRef(null);

   useButtonBehaviour({buttonElement: buttonRef.current as HTMLButtonElement, onClick, onKeyPress});

  return (
    <button
      className={`inline-block border rounded-lg p-2 font-extrabold text-sm font-mono text-gray-800 border border-gray-200 border-b-2 border-b-gray-300 ${classList}`}
      ref={buttonRef}
    >
      {buttonLabel}
    </button>
  );
}
