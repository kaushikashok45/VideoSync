import { SmilePlus } from "lucide-react";
import ReactionPicker from "./reaction-picker.tsx";

export interface ReactionTrayProps {
  open: boolean;
  onToggle: () => void;
  onReact: (emoji: string) => void;
}

export default function ReactionTray({
  open,
  onToggle,
  onReact,
}: ReactionTrayProps) {
  return (
    <div
      className="flex flex-col items-center gap-xs"
      onBlur={(event) => {
        const next = event.relatedTarget;
        if (open && (!next || !event.currentTarget.contains(next))) onToggle();
      }}
    >
      <div
        data-testid="reaction-tray"
        aria-hidden={!open}
        className={`origin-bottom rounded-full border border-line bg-surface-raised/95 px-xs py-xs shadow-pop backdrop-blur transition-[opacity,transform] duration-200 motion-reduce:transition-none ${
          open
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-95 opacity-0"
        }`}
      >
        {open ? <ReactionPicker onReact={onReact} /> : null}
      </div>
      <button
        type="button"
        aria-label={open ? "Close reactions" : "Open reactions"}
        aria-expanded={open}
        onClick={onToggle}
        className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line bg-surface-raised/95 text-ink-muted shadow-pop transition-[color,background-color,transform] duration-200 hover:-translate-y-px hover:bg-brand-soft hover:text-ink focus-visible:ring-2 focus-visible:ring-brand-text focus-visible:ring-offset-2 focus-visible:ring-offset-bg motion-reduce:transition-none motion-reduce:hover:translate-y-0"
      >
        <SmilePlus aria-hidden="true" className="size-5" />
      </button>
    </div>
  );
}
