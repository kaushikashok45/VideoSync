import { ChevronDown, Hash, Headphones, Mic, Users } from "lucide-react";
import { IconButton } from "~/shared/ui-kit/index.ts";

export function RoomChannelRail({
  roomId,
  userName,
}: {
  roomId: string;
  userName: string;
}) {
  return (
    <aside
      data-testid="room-channel-rail"
      aria-label="Room channels"
      className="absolute inset-y-0 left-14 z-30 hidden w-56 flex-col border-r border-white/[0.06] bg-[#0a0a0a] md:flex"
    >
      <header className="flex min-h-12 items-center justify-between border-b border-white/[0.06] px-3.5">
        <strong className="truncate text-sm tracking-[-0.01em]">
          {roomId ? `Room ${roomId}` : "Friday night watch"}
        </strong>
        <IconButton
          label="Room menu"
          className="h-7 w-7 rounded-md text-white/55 hover:bg-white/[0.08] hover:text-white"
        >
          <ChevronDown className="size-4" />
        </IconButton>
      </header>
      <div className="px-2.5 py-4">
        <p className="mb-2 ml-2 text-[11px] font-bold uppercase tracking-[0.08em] text-white/35">
          Watch together
        </p>
        <button
          type="button"
          aria-current="true"
          className="flex min-h-[34px] w-full items-center gap-2 rounded-[5px] bg-white/[0.08] px-2.5 text-left text-sm text-white shadow-[inset_2px_0_#fff]"
        >
          <Hash className="size-[18px] text-[#b8bfff]" />
          <span>watch-party</span>
        </button>
        <button
          type="button"
          className="flex min-h-[34px] w-full items-center gap-2 rounded-[5px] px-2.5 text-left text-sm text-white/60 hover:bg-white/[0.08] hover:text-white"
        >
          <Hash className="size-[18px] text-white/35" />
          <span>room-chat</span>
        </button>
        <button
          type="button"
          className="flex min-h-[34px] w-full items-center gap-2 rounded-[5px] px-2.5 text-left text-sm text-white/60 hover:bg-white/[0.08] hover:text-white"
        >
          <Hash className="size-[18px] text-white/35" />
          <span>reactions</span>
        </button>
        <p className="mb-2 ml-2 mt-6 text-[11px] font-bold uppercase tracking-[0.08em] text-white/35">
          Room info
        </p>
        <button
          type="button"
          className="flex min-h-[34px] w-full items-center gap-2 rounded-[5px] px-2.5 text-left text-sm text-white/60 hover:bg-white/[0.08] hover:text-white"
        >
          <Users className="size-[18px] text-white/35" />
          <span>Invite friends</span>
        </button>
      </div>
      <div className="mt-auto border-t border-white/[0.06] bg-[#080808] p-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid size-[30px] shrink-0 place-items-center rounded-full bg-gradient-to-br from-[#ffca6b] to-[#d45d8c] text-[11px] font-extrabold text-white">
            {userName.slice(0, 2).toUpperCase() || "YO"}
          </span>
          <span className="min-w-0">
            <strong className="block truncate text-xs">
              {userName || "You"}
            </strong>
            <span className="block truncate text-[11px] text-white/35">
              Watching together
            </span>
          </span>
          <span className="ml-auto flex gap-0.5">
            <IconButton
              label="Mute"
              className="h-7 w-7 rounded-md text-white/50 hover:bg-white/[0.08] hover:text-white"
            >
              <Mic className="size-3.5" />
            </IconButton>
            <IconButton
              label="Deafen"
              className="h-7 w-7 rounded-md text-white/50 hover:bg-white/[0.08] hover:text-white"
            >
              <Headphones className="size-3.5" />
            </IconButton>
          </span>
        </div>
      </div>
    </aside>
  );
}
