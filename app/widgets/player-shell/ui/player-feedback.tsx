import type { PlaybackSnapshot } from "contracts/playback.ts";
import { Button, InlineError } from "~/shared/ui-kit/index.ts";
import type { MovieMetadata } from "contracts/movie-metadata.ts";
import PlayerWaitingState from "./player-waiting-state.tsx";
import { formatPlaybackTime } from "./format-playback-time.ts";

export interface PlayerFeedbackProps {
  mode: "host" | "receiver";
  connectionState?:
    | "connecting"
    | "waiting-for-source"
    | "waiting-for-host"
    | "reconnecting"
    | "in-sync";
  src?: string;
  hasStream?: boolean;
  hostPresent?: boolean;
  awaitingSource: boolean;
  autoplayBlocked: boolean;
  visible?: boolean;
  autoplayError?: string | null;
  metadata: MovieMetadata | null;
  onPlay: () => void;
  snapshot?: PlaybackSnapshot;
}

export default function PlayerFeedback({
  mode,
  connectionState,
  src,
  hasStream = false,
  hostPresent = false,
  awaitingSource,
  autoplayBlocked,
  autoplayError = null,
  metadata,
  onPlay,
  snapshot,
}: PlayerFeedbackProps) {
  const playable = Boolean(src) || hasStream;
  const showAudioRecovery = autoplayBlocked || autoplayError !== null;
  const runtimeSeconds = metadata?.runtime
    ? metadata.runtime * 60
    : snapshot?.duration ?? 0;
  const showNowPlaying = mode === "host" && playable &&
    snapshot?.status !== "playing";
  const waitingMessage = mode === "host"
    ? (awaitingSource ? "Loading your video" : null)
    : connectionState === "connecting"
    ? "Connecting to the room."
    : connectionState === "waiting-for-source"
    ? "The host has not chosen a video yet."
    : connectionState === "waiting-for-host"
    ? "You’re in. Waiting for the host to start."
    : connectionState === "reconnecting"
    ? "Connection interrupted. Trying again."
    : awaitingSource
    ? (hostPresent
      ? "The host has not chosen a video yet."
      : "Connecting to the room.")
    : (!hasStream && (Boolean(src) || (snapshot?.duration ?? 0) > 0))
    ? "You’re in. Waiting for the host to start."
    : null;
  const waitingTitle = mode === "host"
    ? "Preparing the stage"
    : connectionState === "waiting-for-host"
    ? "Your room is ready"
    : connectionState === "waiting-for-source"
    ? "Waiting for the host"
    : connectionState === "reconnecting"
    ? "Connection interrupted"
    : "Entering the room";
  return (
    <>
      {waitingMessage
        ? <PlayerWaitingState title={waitingTitle} message={waitingMessage} />
        : null}
      <div
        data-testid="player-feedback-slot"
        className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center"
      >
        {showNowPlaying
          ? (
            <div
              data-testid="now-playing-screen"
              className="pointer-events-auto flex items-center justify-center"
            >
              <div className="pointer-events-none absolute inset-y-0 left-md flex max-w-[min(42rem,calc(100%-2rem))] flex-col items-start justify-center text-left text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.9)]">
                <p className="max-w-full break-words text-balance font-built text-lg font-semibold md:text-xl">
                  {metadata?.title ?? "Now playing"}
                </p>
                {runtimeSeconds > 0
                  ? (
                    <p className="mt-xxs font-mono text-xs text-white/65">
                      {formatPlaybackTime(runtimeSeconds)}
                    </p>
                  )
                  : null}
              </div>
            </div>
          )
          : showAudioRecovery
          ? (
            <div
              data-testid="player-feedback-card"
              className="pointer-events-auto flex min-h-20 w-full max-w-md flex-col items-center justify-center gap-xs border border-line bg-surface-raised/90 px-md py-sm text-center shadow-overlay"
            >
              {autoplayBlocked && playable
                ? (
                  <Button onClick={onPlay} size="lg">
                    Enable sound
                  </Button>
                )
                : null}
              {autoplayError ? <InlineError message={autoplayError} /> : null}
            </div>
          )
          : null}
      </div>
    </>
  );
}
