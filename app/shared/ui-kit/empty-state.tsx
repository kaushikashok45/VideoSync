import type { ReactNode } from "react";

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState(
  { title, description, action, className = "" }: EmptyStateProps,
) {
  return (
    <div
      className={`flex flex-col items-center gap-md px-lg text-center ${className}`}
    >
      <p className="font-script text-2xl leading-snug text-ink">{title}</p>
      {description
        ? (
          <p className="max-w-[70ch] font-mono text-sm text-ink-muted text-pretty">
            {description}
          </p>
        )
        : null}
      {action ? <div className="mt-xs">{action}</div> : null}
    </div>
  );
}
