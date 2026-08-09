import type { JSX } from "react";
import { Menu } from "lucide-react";
import { Popover } from "~/shared/ui-kit/index.ts";

export function LandingNavigation(): JSX.Element {
  return (
    <Popover
      className="landing-nav-popover w-56"
      trigger={
        <button
          type="button"
          aria-label="Open navigation"
          className="grid min-h-11 min-w-11 place-items-center rounded-md border border-line bg-surface text-ink hover:bg-surface-raised"
        >
          <Menu size={18} aria-hidden="true" />
        </button>
      }
    >
      <nav aria-label="Site navigation" className="flex flex-col gap-xs">
        <a
          className="rounded-sm px-sm py-xs text-sm text-ink-muted hover:bg-brand-soft hover:text-brand-text"
          href="#about"
        >
          About
        </a>
        <a
          className="rounded-sm px-sm py-xs text-sm text-ink-muted hover:bg-brand-soft hover:text-brand-text"
          href="#help"
        >
          Help
        </a>
      </nav>
    </Popover>
  );
}
