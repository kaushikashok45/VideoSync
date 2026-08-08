import { useState } from "react";
import type { ButtonHTMLAttributes } from "react";

export interface SwitchProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onChange" | "value"> {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
}

const trackClass =
  "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border border-line-strong transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none";

export function Switch({
  checked,
  onChange,
  className = "",
  ...rest
}: SwitchProps) {
  const [internal, setInternal] = useState(false);
  const isOn = checked ?? internal;
  const activeClass = isOn ? "bg-brand" : "bg-surface-sunken";
  const thumbClass = isOn
    ? "translate-x-5 bg-white"
    : "translate-x-px bg-ink-muted";
  return (
    <button
      {...rest}
      type="button"
      role="switch"
      aria-checked={isOn}
      className={`${trackClass} ${activeClass} ${className}`}
      onClick={() => {
        if (rest.disabled) return;
        const next = !isOn;
        if (checked === undefined) setInternal(next);
        onChange?.(next);
      }}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-5 w-5 rounded-full shadow-sm transition-transform duration-200 motion-reduce:transition-none ${thumbClass}`}
      />
    </button>
  );
}
