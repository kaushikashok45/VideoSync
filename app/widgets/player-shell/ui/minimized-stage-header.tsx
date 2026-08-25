import { Circle, LogOut, Users } from "lucide-react";
import { IconButton } from "~/shared/ui-kit/index.ts";

interface MinimizedStageHeaderProps {
  videoTitle: string;
  watchingCount: number;
  connectionLabel: string;
  participantCount: number;
  onExit?: () => void;
}

export default function MinimizedStageHeader({
  videoTitle,
  watchingCount,
  connectionLabel,
  participantCount,
  onExit,
}: MinimizedStageHeaderProps) {
  return (
    <header
      data-testid="minimized-stage-header"
      className="flex min-h-16 items-start justify-between gap-sm border-b border-line bg-bg px-4 py-3"
    >
      <div className="flex min-w-0 flex-col gap-1">
        <p className="font-built text-xs font-semibold tracking-tight text-ink-faint">
          Sync <span className="font-normal">Party</span>
        </p>
        <strong className="truncate text-sm text-ink">{videoTitle}</strong>
        <span className="flex items-center gap-1.5 text-xs text-ink-muted">
          <Circle
            aria-hidden="true"
            className="size-1.5 fill-status-success text-status-success"
          />
          {watchingCount} watching
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-3.5 pt-0.5">
        <span className="hidden items-center gap-1.5 text-xs font-semibold text-status-success sm:flex">
          <Circle
            aria-hidden="true"
            className="size-2 fill-status-success text-status-success"
          />
          {connectionLabel}
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
          <Users aria-hidden="true" className="size-3.5" />
          {participantCount}
        </span>
        {onExit
          ? (
            <IconButton
              label="Leave watch party"
              onClick={onExit}
              className="h-8 w-8 rounded-md text-ink-muted hover:bg-surface hover:text-ink"
            >
              <LogOut className="size-4" />
            </IconButton>
          )
          : null}
      </div>
    </header>
  );
}
