import type { ReactNode } from "react";

export type BadgeVariant = "default" | "brand" | "success" | "danger";

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClass: Record<BadgeVariant, string> = {
  default: "bg-surface text-ink-muted border border-line-strong",
  brand: "bg-brand text-onbrand",
  success: "bg-status-success/15 text-status-success",
  danger: "bg-status-danger/15 text-status-danger",
};

const baseClass =
  "inline-flex items-center rounded-full px-sm py-xxs font-mono text-xs font-semibold";

export function Badge(
  { children, variant = "default", className = "" }: BadgeProps,
) {
  return (
    <span className={`${baseClass} ${variantClass[variant]} ${className}`}>
      {children}
    </span>
  );
}
