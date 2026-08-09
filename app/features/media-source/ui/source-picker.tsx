import type { SourceKind } from "../model/source-resolver.ts";

export interface SourcePickerProps {
  source: SourceKind;
  onChange: (source: SourceKind) => void;
}

const OPTIONS: Array<{ value: SourceKind; label: string }> = [
  { value: "upload", label: "Upload a video" },
  { value: "url", label: "Use a URL" },
];

export default function SourcePicker({ source, onChange }: SourcePickerProps) {
  return (
    <div
      role="radiogroup"
      aria-label="Video source"
      className="flex w-full gap-xxs rounded-md border border-line bg-surface-sunken p-xxs"
    >
      {OPTIONS.map((option) => {
        const active = source === option.value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            data-testid={`source-${option.value}`}
            onClick={() => onChange(option.value)}
            className={`flex-1 rounded-md px-md py-sm font-built text-sm font-semibold transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-brand-text motion-reduce:transition-none ${
              active
                ? "bg-brand text-onbrand shadow-sm"
                : "bg-transparent text-ink-muted hover:bg-surface-raised hover:text-ink"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
