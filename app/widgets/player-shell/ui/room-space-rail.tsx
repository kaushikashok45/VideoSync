import { CircleHelp, Plus, Sparkles } from "lucide-react";
import { IconButton } from "~/shared/ui-kit/index.ts";

export function RoomSpaceRail() {
  return (
    <nav
      data-testid="room-space-rail"
      aria-label="Spaces"
      className="absolute inset-y-0 left-0 z-30 hidden w-14 flex-col items-center gap-2 border-r border-white/[0.06] bg-[#080808] py-3 md:flex"
    >
      <IconButton
        label="Sync Party home"
        className="h-9 w-9 rounded-lg border border-white bg-white text-black hover:bg-white/90"
      >
        <span className="text-[11px] font-black tracking-[-0.08em]">SP</span>
      </IconButton>
      <span className="h-px w-7 bg-white/[0.06]" aria-hidden="true" />
      <IconButton
        label="The Sync Party"
        aria-pressed="true"
        className="h-9 w-9 rounded-lg border border-white/30 bg-white/[0.08] text-white hover:bg-white/[0.14]"
      >
        <Sparkles className="size-4" />
      </IconButton>
      <IconButton
        label="Add a room"
        className="h-9 w-9 rounded-lg border border-white/[0.06] text-white/55 hover:border-white/30 hover:bg-white/[0.08] hover:text-white"
      >
        <Plus className="size-4" />
      </IconButton>
      <span className="flex-1" aria-hidden="true" />
      <IconButton
        label="Help"
        className="h-9 w-9 rounded-lg border border-white/[0.06] text-white/55 hover:border-white/30 hover:bg-white/[0.08] hover:text-white"
      >
        <CircleHelp className="size-4" />
      </IconButton>
    </nav>
  );
}
