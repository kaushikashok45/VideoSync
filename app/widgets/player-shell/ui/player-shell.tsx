import { useRef, useSyncExternalStore } from "react";
import type { MediaSource } from "contracts/media-source.ts";
import type { Member } from "contracts/member.ts";
import type { MovieMetadata } from "contracts/movie-metadata.ts";
import {
  createPlaybackStore,
  type PlaybackStore,
} from "~/entities/playback/playback-store.ts";
import { useIdleVisibility } from "../logic/use-idle-visibility.ts";
import ControlBar from "./control-bar.tsx";
import PlaybackSync, { type PlaybackSyncHandle } from "./playback-sync.tsx";
import UploadWaiting from "./upload-waiting.tsx";

export interface PlayerShellProps {
  mode: "host" | "receiver";
  media: MediaSource | { url?: string };
  metadata?: MovieMetadata | null;
  me?: Member | null;
  idleMs?: number;
  playbackStore?: PlaybackStore;
}

const DRIFT_THRESHOLD_MS = 1500;

function videoSource(media: PlayerShellProps["media"]): string | undefined {
  if ("mode" in media) {
    if (media.mode === "url") return media.url;
    return undefined;
  }
  return media.url;
}

function isUploadMode(media: PlayerShellProps["media"]): boolean {
  return "mode" in media && media.mode === "upload";
}

export default function PlayerShell({
  mode,
  media,
  metadata = null,
  me = null,
  idleMs = 3000,
  playbackStore,
}: PlayerShellProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const syncHandleRef = useRef<PlaybackSyncHandle>(null);
  const storeRef = useRef<PlaybackStore | null>(playbackStore ?? null);
  if (!storeRef.current) {
    storeRef.current = createPlaybackStore({
      driftThresholdMs: DRIFT_THRESHOLD_MS,
    });
  }
  const store = storeRef.current;
  const { visible, reveal } = useIdleVisibility(idleMs);
  const snapshot = useSyncExternalStore(
    store.subscribe,
    () => store.getState().getSnapshot(),
  );
  const src = videoSource(media);

  return (
    <div
      data-testid="player-shell"
      role="group"
      aria-label={mode === "host" ? "Host player" : "Receiver player"}
      onPointerMove={reveal}
      onKeyDown={reveal}
      onClick={reveal}
      className="relative aspect-video w-full overflow-hidden rounded-lg bg-surface-sunken"
    >
      <video
        ref={videoRef}
        src={src}
        preload="metadata"
        playsInline
        className="h-full w-full object-contain"
        data-testid="player-video"
      />
      {isUploadMode(media) ? <UploadWaiting /> : null}
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
      <ControlBar
        hidden={!visible}
        me={me}
        store={store}
        snapshot={snapshot}
        syncHandleRef={syncHandleRef}
      />
      <PlaybackSync
        store={store}
        videoRef={videoRef}
        actionRef={syncHandleRef}
      />
    </div>
  );
}
