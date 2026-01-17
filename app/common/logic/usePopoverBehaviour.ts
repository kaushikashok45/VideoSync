import { useEffect, useState, useRef, MutableRefObject } from "react";
import type { usePopoverBehaviourParams, usePopoverBehaviourResult } from "../contracts/Popover";
import PopoverRegistry from "./popoverRegistry";

export function usePopoverBehaviour({ triggerElement, popoverElement}: usePopoverBehaviourParams):usePopoverBehaviourResult {
    const [isPopoverVisible, setIsPopoverVisible] = useState(false);
        const popoverRef = useRef<HTMLDivElement>(null);
        const timerId: MutableRefObject<NodeJS.Timeout | null> = useRef(null);
    
        function getPopoverRegistryObject() {
            return {
                ref: popoverRef,
                closePopup: () => {
                    if (timerId.current) {
                        clearTimeout(timerId.current);
                    }
                    setIsPopoverVisible(false);
                },
            };
        }
    
        useEffect(() => {
            function showPopover() {
                // Clear any existing timer
                if (timerId.current) {
                    clearTimeout(timerId.current);
                    timerId.current = null;
                }
                PopoverRegistry.closeActivePopups();
                setIsPopoverVisible(true);
                PopoverRegistry.registerPopup(getPopoverRegistryObject());
            }
        
            function hidePopover() {
                setIsPopoverVisible(false);
            }
        
            function hidePopoverAfterDelay() {
                // Hide after a short delay
                timerId.current = setTimeout(() => {
                    setIsPopoverVisible(false);
                }, 1500); // 1.5s delay
            }
    
            if (triggerElement) {
                triggerElement.addEventListener("mouseenter", showPopover);
                triggerElement.addEventListener(
                    "mouseleave",
                    hidePopoverAfterDelay
                );
            }
    
            if (popoverElement) {
                popoverElement.addEventListener("mouseenter", showPopover);
                popoverElement.addEventListener("mouseleave", hidePopover);
            }
    
            return () => {
                // Clear any pending timers
                if (timerId.current) {
                    clearTimeout(timerId.current);
                }
    
                if (triggerElement) {
                    triggerElement.removeEventListener("mouseenter", showPopover);
                    triggerElement.removeEventListener(
                        "mouseleave",
                        hidePopoverAfterDelay
                    );
                }
    
                if (popoverElement) {
                    popoverElement.removeEventListener("mouseenter", showPopover);
                    popoverElement.removeEventListener("mouseleave", hidePopover);
                }
            };
        }, [triggerElement, popoverElement]);

        return { isPopoverVisible };
}