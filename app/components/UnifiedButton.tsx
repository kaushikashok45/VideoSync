import { MutableRefObject, useEffect, useRef } from "react";

type UnifiedButtonProps = {
    buttonLabel: string;
    classList?: string;
    onClick?: (e: MouseEvent) => void;
    onKeyPress?: (e: KeyboardEvent) => void;
};

export default function UnifiedButton({
    buttonLabel,
    classList = "",
    onClick,
    onKeyPress,
}: UnifiedButtonProps) {
    const buttonRef: MutableRefObject<HTMLButtonElement | null> = useRef(null);

    useEffect(() => {
        if (!buttonRef.current) return;
        const buttonElement = buttonRef.current;
        onClick && buttonElement.addEventListener("click", onClick);
        onKeyPress && buttonElement.addEventListener("keypress", onKeyPress);

        return () => {
            if (!buttonElement) return;
            onClick && buttonElement.removeEventListener("click", onClick);
            onKeyPress &&
                buttonElement.removeEventListener("keypress", onKeyPress);
        };
    }, [onClick, onKeyPress]);

    return (
        <button
            className={`inline-block border rounded-lg p-2 font-extrabold text-sm font-mono text-gray-800 bg-gray-100 border border-gray-200 border-b-2 border-b-gray-300 ${classList}`}
            ref={buttonRef}
        >
            {buttonLabel}
        </button>
    );
}
