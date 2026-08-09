import type { PlaybackSnapshot } from "contracts/playback.ts";
import { Button, InlineError } from "~/shared/ui-kit/index.ts";
import type { MovieMetadata } from "contracts/movie-metadata.ts";
import PlayerWaitingState from "./player-waiting-state.tsx";

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
  autoplayError?: string | null;
  visible: boolean;
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
  visible,
  metadata,
  onPlay,
  snapshot,
}: PlayerFeedbackProps) {
  const playable = Boolean(src) || hasStream;
  const showAudioRecovery = autoplayBlocked || autoplayError !== null;
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
  const connectionLabel = connectionState === "in-sync"
    ? "In sync"
    : connectionState === "reconnecting"
    ? "Reconnecting"
    : null;
  return (
    <>
      {waitingMessage
        ? <PlayerWaitingState title={waitingTitle} message={waitingMessage} />
        : null}
      {connectionLabel
        ? (
          <div
            data-testid="player-connection-status"
            role="status"
            aria-live="polite"
            className="pointer-events-none absolute bottom-24 right-md z-20 rounded-full border border-line bg-surface-raised/90 px-sm py-xxs font-built text-xs font-semibold text-ink shadow-pop"
          >
            {connectionLabel}
          </div>
        )
        : null}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 bg-gradient-to-t from-bg/80 via-transparent to-bg/40 transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />
      {metadata?.title
        ? (
          <div className="pointer-events-none absolute left-md top-16 z-10 max-w-[min(28rem,calc(100%-2rem))]">
            <h2 className="font-built text-base font-semibold text-ink">
              {metadata.title}
            </h2>
          </div>
        )
        : null}
      <div
        data-testid="player-feedback-slot"
        className="pointer-events-none absolute inset-x-md bottom-[6.5rem] z-20 flex min-h-20 items-center justify-center"
      >
        {showNowPlaying
          ? (
            <div
              data-testid="now-playing-screen"
              className="pointer-events-auto flex w-full max-w-xl flex-col gap-md border border-line bg-surface-raised/95 p-lg text-left shadow-overlay md:p-xl"
            >
              <div className="flex items-start justify-between gap-md">
                <div>
                  <p className="font-built text-xs font-semibold text-brand-text">
                    Now playing
                  </p>
                  <h2 className="mt-xs font-built text-2xl font-semibold text-ink text-balance md:text-3xl">
                    {metadata?.title ?? "Your movie night"}
                  </h2>
                </div>
                <Button size="md" onClick={onPlay}>Play</Button>
              </div>
              <p className="max-w-[60ch] text-sm leading-relaxed text-ink-muted text-pretty">
                {metadata?.overview ||
                  "Press play when everyone is ready. Playback stays in sync for the room."}
              </p>
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
