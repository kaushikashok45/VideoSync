import type { ReactNode } from "react";
import BackgroundAmbience from "~/widgets/brand-shell/ui/background-ambience.tsx";
import BrandMark from "~/widgets/brand-shell/ui/brand-mark.tsx";
import ThemeToggle from "~/widgets/brand-shell/ui/theme-toggle.tsx";

export interface EntryLayoutProps {
  children: ReactNode;
  headerActions?: ReactNode;
}

export function EntryLayout({ children, headerActions }: EntryLayoutProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-bg">
      <BackgroundAmbience />
      <div className="absolute right-md top-md z-sticky flex items-center gap-xs">
        {headerActions}
        <ThemeToggle />
      </div>
      <div className="mx-auto flex min-h-screen w-full flex-col gap-xl px-md py-lg md:gap-xxl md:px-[clamp(2rem,5vw,5rem)] md:py-[clamp(2rem,4vw,4rem)]">
        <header className="flex items-end justify-between gap-md border-b border-line pb-lg pr-xl">
          <BrandMark />
          <p className="hidden max-w-[30ch] text-right font-mono text-sm leading-relaxed text-ink-muted md:block">
            A shared screen for the people you wish were in the room.
          </p>
        </header>
        <main id="main-content" className="flex-1">{children}</main>
      </div>
    </div>
  );
}
