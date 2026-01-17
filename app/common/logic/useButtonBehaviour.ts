import { useEffect } from "react";
import type { ButtonBehaviourProps } from "../contracts/Button";

export default function useButtonBehaviour({buttonElement, onClick, onKeyPress}:ButtonBehaviourProps):void {

    useEffect(() => {
        if (!buttonElement) return;
        onClick && buttonElement.addEventListener("click", onClick);
        onKeyPress && buttonElement.addEventListener("keypress", onKeyPress);

        return () => {
            if (!buttonElement) return;
            onClick && buttonElement.removeEventListener("click", onClick);
            onKeyPress && buttonElement.removeEventListener("keypress", onKeyPress);
        };
    }, [buttonElement, onClick, onKeyPress]);

}