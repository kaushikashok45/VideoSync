import { useState, useRef, useEffect, MutableRefObject } from "react";
import PopoverRegistry from "../utils/popoverRegistry";

type PopoverProps = {
  children: React.ReactNode;
  triggerElementRef: React.RefObject<HTMLElement>;
  classList?: string;
};

export default function Popover({
  children,
  triggerElementRef,
  classList,
}: PopoverProps) {
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
        hidePopover();
      },
    };
  }

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
    }, 1500); // 300ms delay
  }

  useEffect(() => {
    const triggerElement = triggerElementRef.current;
    const popoverElement = popoverRef.current;

    if (triggerElement) {
      triggerElement.addEventListener("mouseenter", showPopover);
      triggerElement.addEventListener("mouseleave", hidePopoverAfterDelay);
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
        triggerElement.removeEventListener("mouseleave", hidePopoverAfterDelay);
      }

      if (popoverElement) {
        popoverElement.removeEventListener("mouseenter", showPopover);
        popoverElement.removeEventListener("mouseleave", hidePopover);
      }
    };
  }, [triggerElementRef]);

  return (
    <div
      className={`absolute bg-slate-200 dark:bg-gray-800 p-3 rounded-lg shadow-lg bottom-full left-1/2 -translate-x-1/2 mb-2 transition-opacity duration-200 ${
        isPopoverVisible ? "opacity-100 visible" : "opacity-0 invisible"
      } ${classList ? classList : ""}`}
      ref={popoverRef}
    >
      {children}
    </div>
  );
}
