import { useEffect } from "react";

function useEventListener(
    eventName: string,
    eventHandler: EventListener,
    element: HTMLElement
) {
    useEffect(() => {
        if (!element) return;
        element.addEventListener(eventName, eventHandler);
        return () => {
            element.removeEventListener(eventName, eventHandler);
        };
    }, [element, eventName, eventHandler]);
}

export default useEventListener;
