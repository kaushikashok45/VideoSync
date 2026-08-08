import { useEffect } from "react";
import type { ButtonBehaviourProps } from "../contracts/Button";

export default function useButtonBehaviour(
  { buttonRef, onClick, onKeyPress }: ButtonBehaviourProps,
): void {
  useEffect(() => {
    const buttonElement = buttonRef.current;
    if (!buttonElement) return;
    onClick && buttonElement.addEventListener("click", onClick);
    onKeyPress && buttonElement.addEventListener("keypress", onKeyPress);

    return () => {
      if (!buttonElement) return;
      onClick && buttonElement.removeEventListener("click", onClick);
      onKeyPress && buttonElement.removeEventListener("keypress", onKeyPress);
    };
  }, [buttonRef, onClick, onKeyPress]);
}
