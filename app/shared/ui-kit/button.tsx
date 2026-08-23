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
  primary:
    "bg-brand text-onbrand border-transparent hover:bg-brand-hover hover:shadow-glow active:scale-[0.98]",
  secondary:
    "bg-transparent text-ink border-line hover:border-line-strong hover:bg-surface active:scale-[0.98]",
  ghost:
    "bg-transparent text-ink-muted border-transparent hover:text-ink hover:bg-surface active:scale-[0.98]",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "px-sm py-xs text-sm",
  md: "px-md py-sm text-sm",
  lg: "px-lg py-md text-base",
};

const baseClass =
  "inline-flex min-h-11 items-center justify-center gap-xs rounded-full border font-sans text-sm font-semibold transition-[color,background-color,border-color,transform,box-shadow] duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-40 motion-reduce:hover:scale-100 motion-reduce:transition-none";

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
