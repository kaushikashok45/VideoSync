import { cloneElement, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type {
  HTMLAttributes,
  MouseEvent as ReactMouseEvent,
  ReactElement,
  ReactNode,
  Ref,
  RefObject,
} from "react";

export type PopoverTriggerProps = HTMLAttributes<HTMLElement> & {
  ref?: Ref<HTMLElement>;
};

export interface PopoverProps {
  trigger: ReactElement<PopoverTriggerProps>;
  children: ReactNode;
  className?: string;
}

function usePopoverDismiss(
  open: boolean,
  close: () => void,
  triggerRef: RefObject<HTMLElement | null>,
  contentRef: RefObject<HTMLDivElement | null>,
): void {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (contentRef.current?.contains(target)) return;
      close();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [open, close, triggerRef, contentRef]);
}

export function Popover({ trigger, children, className = "" }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  usePopoverDismiss(open, () => setOpen(false), triggerRef, contentRef);

  const triggerWithProps = cloneElement(trigger, {
    ...trigger.props,
    ref: triggerRef,
    "aria-expanded": open,
    onClick: (event: ReactMouseEvent<HTMLElement>) => {
      trigger.props.onClick?.(event);
      setOpen((value) => !value);
    },
  });

  return (
    <>
      {triggerWithProps}
      {open && typeof document !== "undefined"
        ? createPortal(
          <div
            ref={contentRef}
            className={`fixed z-dropdown rounded-lg border border-line-strong bg-surface-raised p-md shadow-overlay animate-fade-in motion-reduce:animate-none ${className}`}
          >
            {children}
          </div>,
          document.body,
        )
        : null}
    </>
  );
}
