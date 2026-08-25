import { Circle, LogOut, MessageSquareText, Settings } from "lucide-react";
import { IconButton } from "~/shared/ui-kit/index.ts";

export interface PlayerHeaderProps {
  roomId: string;
  connectionLabel: string;
  onOpenRoom: (tab: "chat" | "members") => void;
  onExit?: () => void;
}

export default function PlayerHeader({
  roomId,
  connectionLabel,
  onOpenRoom,
  onExit,
}: PlayerHeaderProps) {
  return (
    <header
      data-testid="player-header"
      className="pointer-events-none absolute inset-x-0 top-0 z-30 flex min-h-12 items-center gap-3 border-b border-white/[0.06] bg-black px-4"
    >
      <div className="flex min-w-0 items-center gap-2">
        <span className="font-built text-sm font-semibold tracking-tight text-white/70">
          Sync <span className="font-normal text-white/35">Party</span>
        </span>
        <span className="text-white/25" aria-hidden="true">·</span>
        <strong className="truncate text-sm">watch-party</strong>
        <span className="hidden truncate text-sm text-white/35 sm:inline">
          · {roomId ? `Room ${roomId}` : "Friday night watch"}
        </span>
      </div>
      <span className="flex-1" aria-hidden="true" />
      <div className="flex items-center gap-1.5">
        <span className="hidden items-center gap-1.5 text-xs font-semibold text-[#8de1aa] sm:flex">
          <Circle className="size-2 fill-[#46c37b] text-[#46c37b]" />
          {connectionLabel}
        </span>
        <div className="pointer-events-auto flex items-center gap-0.5 text-white/70">
          <IconButton
            label="Open chat"
            onClick={() => onOpenRoom("chat")}
            className="h-8 w-8 rounded-md hover:bg-white/10 hover:text-white"
          >
            <MessageSquareText className="size-4" />
          </IconButton>
          <IconButton
            label="Open room settings"
            onClick={() => onOpenRoom("members")}
            className="h-8 w-8 rounded-md hover:bg-white/10 hover:text-white"
          >
            <Settings className="size-4" />
          </IconButton>
          {onExit
            ? (
              <IconButton
                label="Leave watch party"
                onClick={onExit}
                className="h-8 w-8 rounded-md hover:bg-white/10 hover:text-white"
              >
                <LogOut className="size-4" />
              </IconButton>
            )
            : null}
        </div>
      </div>
    </header>
  );
}
