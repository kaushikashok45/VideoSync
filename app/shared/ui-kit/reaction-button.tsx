import type { ButtonHTMLAttributes } from "react";

export interface ReactionButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement> {
  emoji: string;
  label: string;
}

const baseClass =
  "inline-flex h-11 w-11 items-center justify-center rounded-full bg-surface-raised text-xl shadow-pop transition-transform duration-200 ease-out hover:-translate-y-1 hover:bg-brand-soft focus-visible:ring-2 focus-visible:ring-brand-text focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:hover:translate-y-0 motion-reduce:transition-none";

export function ReactionButton(
  { emoji, label, className = "", ...rest }: ReactionButtonProps,
) {
  return (
    <button
      {...rest}
      type="button"
      aria-label={label}
      className={`${baseClass} ${className}`}
    >
      <span aria-hidden="true">{emoji}</span>
    </button>
  );
}
