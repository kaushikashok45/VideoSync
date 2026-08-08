import type { MovieMetadata } from "contracts/movie-metadata.ts";
import UploadWaiting from "./upload-waiting.tsx";

export interface PlayerFeedbackProps {
  mode: "host" | "receiver";
  src?: string;
  hasStream?: boolean;
  awaitingSource: boolean;
  autoplayBlocked: boolean;
  visible: boolean;
  metadata: MovieMetadata | null;
  onPlayWithSound: () => void;
}

export default function PlayerFeedback({
  mode,
  src,
  hasStream = false,
  awaitingSource,
  autoplayBlocked,
  visible,
  metadata,
  onPlayWithSound,
}: PlayerFeedbackProps) {
  const playable = Boolean(src) || hasStream;
  return (
    <>
      {awaitingSource ? <UploadWaiting mode={mode} /> : null}
      {autoplayBlocked && playable
        ? (
          <button
            type="button"
            className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand px-lg py-md font-mono text-sm font-semibold text-onbrand shadow-overlay transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-brand-text motion-reduce:transition-none motion-reduce:hover:scale-100"
            onClick={onPlayWithSound}
          >
            Play with sound
          </button>
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
          <div className="pointer-events-none absolute left-md top-md z-10">
            <h2 className="font-mono text-sm font-semibold text-ink">
              {metadata.title}
            </h2>
          </div>
        )
        : null}
    </>
  );
}
