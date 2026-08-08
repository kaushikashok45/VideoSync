import { cloneElement, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { HTMLAttributes, ReactElement, ReactNode, Ref } from "react";

export type PopoverTriggerProps = HTMLAttributes<HTMLElement> & {
  ref?: Ref<HTMLElement>;
};

export interface PopoverProps {
  trigger: ReactElement<PopoverTriggerProps>;
  children: ReactNode;
  className?: string;
}

export function Popover({ trigger, children, className = "" }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const handleMouseDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target)) return;
      if (contentRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handleMouseDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handleMouseDown);
    };
  }, [open]);

  const contentRef = useRef<HTMLDivElement>(null);

  const triggerWithProps = cloneElement(trigger, {
    ...trigger.props,
    ref: triggerRef,
    "aria-expanded": open,
    onClick: () => setOpen((value) => !value),
  });

  return (
    <>
      {triggerWithProps}
      {open && typeof document !== "undefined"
        ? createPortal(
          <div
            ref={contentRef}
            role="dialog"
            className={`fixed z-dropdown rounded-lg border border-line-strong bg-surface-raised p-md shadow-overlay animate-fade-in ${className}`}
          >
            {children}
          </div>,
          document.body,
        )
        : null}
    </>
  );
}
