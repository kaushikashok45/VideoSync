import type { ReactNode } from "react";

export type BadgeVariant = "default" | "brand" | "success" | "danger";

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClass: Record<BadgeVariant, string> = {
  default: "border border-line-strong bg-surface-raised text-ink-muted",
  brand: "bg-brand-muted text-brand-text border border-brand-text/20",
  success:
    "border border-status-success/25 bg-status-success/15 text-status-success",
  danger:
    "border border-status-danger/25 bg-status-danger/15 text-status-danger",
};

const baseClass =
  "inline-flex items-center rounded-full px-sm py-xs font-built text-xs font-semibold";

export function Badge(
  { children, variant = "default", className = "" }: BadgeProps,
) {
  return (
    <span className={`${baseClass} ${variantClass[variant]} ${className}`}>
      {children}
    </span>
  );
}
