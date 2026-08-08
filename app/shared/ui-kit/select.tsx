import { useId } from "react";
import type { SelectHTMLAttributes } from "react";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
}

const baseClass =
  "w-full appearance-none rounded-md border border-line bg-surface-sunken px-md py-sm pr-lg font-mono text-ink placeholder:text-ink-faint transition-colors duration-200 focus:border-brand-text focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-text/50 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none";

export function Select({
  label,
  error,
  className = "",
  children,
  ...rest
}: SelectProps) {
  const generatedId = useId();
  const fieldId = rest.id ?? generatedId;
  return (
    <div className="flex flex-col gap-xs">
      {label
        ? (
          <label
            htmlFor={fieldId}
            className="font-mono text-sm font-medium text-ink-muted"
          >
            {label}
          </label>
        )
        : null}
      <div className="relative">
        <select
          {...rest}
          id={fieldId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${fieldId}-error` : undefined}
          className={`${baseClass} ${className}`}
        >
          {children}
        </select>
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          className="pointer-events-none absolute right-sm top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint"
        >
          <path
            d="m6 8 4 4 4-4"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {error
        ? (
          <p
            id={`${fieldId}-error`}
            className="font-mono text-xs text-status-danger"
          >
            {error}
          </p>
        )
        : null}
    </div>
  );
}
