import type { ReactNode } from "react";

export type BadgeVariant = "default" | "brand" | "success" | "danger";

export interface BadgeProps {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClass: Record<BadgeVariant, string> = {
  default: "border border-line bg-transparent text-ink-muted",
  brand: "bg-brand text-onbrand border border-transparent",
  success:
    "border border-status-success/25 bg-status-success/15 text-status-success",
  danger:
    "border border-status-danger/25 bg-status-danger/15 text-status-danger",
};

const baseClass =
  "inline-flex items-center rounded-full px-sm py-xs font-sans text-xs font-semibold";

export function Badge(
  { children, variant = "default", className = "" }: BadgeProps,
) {
  return (
    <span className={`${baseClass} ${variantClass[variant]} ${className}`}>
      {children}
    </span>
  );
}
