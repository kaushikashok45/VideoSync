import { useRef } from "react";
import type { PopoverProps } from "../contracts/Popover";
import { usePopoverBehaviour } from "../logic/usePopoverBehaviour";

export default function Popover({
    children,
    triggerElementRef,
    classList,
}: PopoverProps) {

    const popoverRef = useRef<HTMLDivElement>(null);
    const { isPopoverVisible } = usePopoverBehaviour({ popoverElement: popoverRef.current as HTMLElement, triggerElement: triggerElementRef.current as HTMLElement });
    const visibilityCssClass = isPopoverVisible ? "opacity-100 visible" : "opacity-0 invisible";
    const userDefinedClassList = classList ? classList : "";
    const combinedClassList = visibilityCssClass + " " + userDefinedClassList;

    return (
        <div
            className={`absolute bg-slate-200 dark:bg-gray-800 p-3 rounded-lg shadow-lg bottom-full left-1/2 -translate-x-1/2 mb-2 transition-opacity duration-200 dark:bg-black/40 backdrop-blur-md border border-white/10 rounded-full p-3 ${combinedClassList}`}
            ref={popoverRef}
        >
            {children}
        </div>
    );
}

