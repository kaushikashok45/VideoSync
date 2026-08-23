import type { CSSProperties } from "react";
import { EASING } from "~/shared/ui-kit/index.ts";
import type { SourceKind } from "../model/source-resolver.ts";

interface SourcePickerProps {
  source: SourceKind;
  onChange: (source: SourceKind) => void;
}

interface SourceOption {
  value: SourceKind;
  label: string;
}

const OPTIONS: SourceOption[] = [
  { value: "upload", label: "Upload a video" },
  { value: "url", label: "Use a URL" },
];

// Padding + gap are both the "xxs" token (4px) — kept in sync with the
// container className so the pill's geometry matches the buttons exactly.
const INSET_PX = 4;

function pillStyle(activeIndex: number): CSSProperties {
  return {
    width: `calc((100% - ${INSET_PX * 3}px) / 2)`,
    transform: `translateX(calc(${activeIndex} * (100% + ${INSET_PX}px)))`,
    transitionTimingFunction: EASING.easeOutExpo,
  };
}

function SourceOptionButton(
  { option, active, onSelect }: {
    option: SourceOption;
    active: boolean;
    onSelect: () => void;
  },
) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      data-testid={`source-${option.value}`}
      onClick={onSelect}
      className={`relative z-10 flex-1 rounded-md px-md py-sm font-built text-sm font-semibold transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-brand-text motion-reduce:transition-none ${
        active ? "text-onbrand" : "text-ink-muted hover:text-ink"
      }`}
    >
      {option.label}
    </button>
  );
}

function SegmentedPill({ activeIndex }: { activeIndex: number }) {
  return (
    <span
      aria-hidden="true"
      className="absolute bottom-xxs top-xxs left-xxs rounded-md bg-brand shadow-sm transition-transform duration-[320ms] motion-reduce:transition-none"
      style={pillStyle(activeIndex)}
    />
  );
}

export function SourcePicker({ source, onChange }: SourcePickerProps) {
  const activeIndex = OPTIONS.findIndex((option) => option.value === source);
  return (
    <div
      role="radiogroup"
      aria-label="Video source"
      className="relative flex w-full gap-xxs rounded-md border border-line bg-surface-sunken p-xxs"
    >
      <SegmentedPill activeIndex={activeIndex} />
      {OPTIONS.map((option) => (
        <SourceOptionButton
          key={option.value}
          option={option}
          active={source === option.value}
          onSelect={() => onChange(option.value)}
        />
      ))}
    </div>
  );
}
