import { LogOut } from "lucide-react";
import { IconButton } from "~/shared/ui-kit/index.ts";

export interface PlayerHeaderProps {
  roomId: string;
  onExit?: () => void;
}

export default function PlayerHeader({ roomId, onExit }: PlayerHeaderProps) {
  return (
    <header className="pointer-events-none absolute inset-x-md top-md z-20 flex items-center justify-center">
      <p className="rounded-full border border-line bg-surface-raised/90 px-sm py-xs font-mono text-xs text-ink shadow-pop">
        Room {roomId}
      </p>
      {onExit
        ? (
          <IconButton
            label="Leave watch party"
            onClick={onExit}
            className="pointer-events-auto absolute right-12 border border-line bg-surface-raised/90 shadow-pop"
          >
            <LogOut className="size-4" />
          </IconButton>
        )
        : null}
    </header>
  );
}
