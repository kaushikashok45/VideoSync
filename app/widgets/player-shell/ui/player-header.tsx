import { LogOut, MessageSquareText, Settings } from "lucide-react";
import { IconButton } from "~/shared/ui-kit/index.ts";

export interface PlayerHeaderProps {
  roomId: string;
  onOpenRoom: (tab: "chat" | "members") => void;
  onExit?: () => void;
}

export default function PlayerHeader({
  roomId,
  onOpenRoom,
  onExit,
}: PlayerHeaderProps) {
  return (
    <header
      data-testid="player-header"
      className="pointer-events-none absolute inset-x-md top-md z-30 flex items-center justify-between gap-md"
    >
      <p className="font-built text-xl font-semibold tracking-tight text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)]">
        Sync <span className="font-normal">Party</span>
      </p>
      <div className="pointer-events-auto flex items-center gap-sm text-white/80 drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)]">
        <span className="hidden font-mono text-xs text-white/60 sm:inline-flex">
          {roomId ? `ROOM / ${roomId}` : "ROOM"}
        </span>
        <IconButton
          label="Open chat and members"
          onClick={() => onOpenRoom("chat")}
          className="text-white hover:bg-white/10 hover:text-white"
        >
          <MessageSquareText className="size-4.5" />
        </IconButton>
        <IconButton
          label={`Open room settings for ${roomId}`}
          onClick={() => onOpenRoom("members")}
          className="text-white hover:bg-white/10 hover:text-white"
        >
          <Settings className="size-4.5" />
        </IconButton>
        {onExit
          ? (
            <IconButton
              label="Leave watch party"
              onClick={onExit}
              className="text-white hover:bg-white/10 hover:text-white"
            >
              <LogOut className="size-4" />
            </IconButton>
          )
          : null}
      </div>
    </header>
  );
}
