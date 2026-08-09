import { Spinner } from "~/shared/ui-kit/index.ts";

export interface PlayerWaitingStateProps {
  title: string;
  message: string;
}

export default function PlayerWaitingState({
  title,
  message,
}: PlayerWaitingStateProps) {
  return (
    <div
      data-testid="upload-waiting"
      role="status"
      aria-live="polite"
      className="absolute inset-0 z-20 flex items-center justify-center bg-bg/70 px-md"
    >
      <div className="flex w-full max-w-md flex-col gap-md border border-line bg-surface-raised/95 p-lg text-center shadow-overlay md:p-xl">
        <div className="flex items-center justify-center gap-sm">
          <Spinner size="md" />
          <p className="font-built text-xs font-semibold text-brand-text">
            {title}
          </p>
        </div>
        <p className="font-built text-lg font-semibold text-ink text-balance">
          {message}
        </p>
        <p className="font-built text-sm leading-relaxed text-ink-muted">
          The stage will come alive as soon as the room is ready.
        </p>
      </div>
    </div>
  );
}
