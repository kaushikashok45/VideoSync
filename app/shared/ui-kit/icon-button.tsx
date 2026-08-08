import type { ButtonHTMLAttributes, ReactNode } from "react";

export interface IconButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  children: ReactNode;
}

const baseClass =
  "inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-muted transition-colors duration-200 hover:bg-brand-soft hover:text-ink focus-visible:ring-2 focus-visible:ring-brand-text focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none";

export function IconButton(
  { label, children, className = "", ...rest }: IconButtonProps,
) {
  return (
    <button
      {...rest}
      type="button"
      aria-label={label}
      className={`${baseClass} ${className}`}
    >
      {children}
    </button>
  );
}
