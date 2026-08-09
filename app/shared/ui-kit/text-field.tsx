import { useId } from "react";
import type { InputHTMLAttributes } from "react";

export interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helper?: string;
  error?: string;
}

const baseClass =
  "min-h-11 w-full rounded-md border bg-surface-sunken px-md py-sm font-built text-base text-ink placeholder:text-ink-muted transition-[color,background-color,border-color,box-shadow] duration-200 focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand-text/50 disabled:cursor-not-allowed disabled:opacity-60 motion-reduce:transition-none";

export function TextField({
  label,
  helper,
  error,
  className = "",
  ...rest
}: TextFieldProps) {
  const generatedId = useId();
  const fieldId = rest.id ?? generatedId;
  const describedBy = error
    ? `${fieldId}-error`
    : helper
    ? `${fieldId}-helper`
    : undefined;
  const borderClass = error
    ? "border-status-danger focus:border-status-danger focus:ring-status-danger/50"
    : "border-line focus:border-brand-text focus:ring-brand-text/50";
  return (
    <div className="flex flex-col gap-xs">
      {label
        ? (
          <label
            htmlFor={fieldId}
            className="font-built text-sm font-semibold text-ink"
          >
            {label}
          </label>
        )
        : null}
      <input
        {...rest}
        id={fieldId}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={`${baseClass} ${borderClass} ${className}`}
      />
      {error
        ? (
          <p
            id={`${fieldId}-error`}
            className="font-built text-sm text-status-danger"
          >
            {error}
          </p>
        )
        : null}
      {!error && helper
        ? (
          <p
            id={`${fieldId}-helper`}
            className="font-mono text-xs text-ink-faint"
          >
            {helper}
          </p>
        )
        : null}
    </div>
  );
}
