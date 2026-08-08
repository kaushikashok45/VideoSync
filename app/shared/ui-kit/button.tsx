import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Spinner } from "./spinner.tsx";

export type ButtonVariant = "primary" | "secondary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children?: ReactNode;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-brand text-onbrand hover:bg-brand-hover border-transparent",
  secondary:
    "bg-surface text-ink border border-line-strong hover:border-ink-faint",
  ghost:
    "bg-transparent text-brand-text border-transparent hover:bg-brand-soft",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "px-sm py-xs text-sm",
  md: "px-md py-sm text-sm",
  lg: "px-lg py-md text-base",
};

const baseClass =
  "inline-flex items-center justify-center gap-xs rounded-md border font-mono font-semibold transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-brand-text focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none";

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  children,
  className = "",
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      type={rest.type ?? "button"}
      disabled={rest.disabled || loading}
      aria-busy={loading || undefined}
      className={`${baseClass} ${variantClass[variant]} ${
        sizeClass[size]
      } ${className}`}
    >
      {loading ? <Spinner size="sm" /> : null}
      {children}
    </button>
  );
}
