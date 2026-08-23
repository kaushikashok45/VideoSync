import type { RefObject } from "react";
import type { Member } from "contracts/member.ts";
import type { PlaybackSnapshot } from "contracts/playback.ts";
import type { PlaybackStore } from "~/entities/playback/playback-store.ts";
import { canControlRoom } from "~/features/playback-control/model/playback-behaviour.ts";
import PlaybackControls from "~/features/playback-control/ui/playback-controls.tsx";
import Seeker from "./seeker.tsx";
import UtilityControls from "./utility-controls.tsx";
import type { PlaybackSyncHandle } from "./playback-sync.tsx";
import { formatPlaybackTime } from "./format-playback-time.ts";

export interface ControlBarProps {
  hidden: boolean;
  me: Member | null;
  volume: number;
  onVolumeChange: (volume: number) => void;
  store: PlaybackStore;
  snapshot: PlaybackSnapshot | undefined;
  syncHandleRef: RefObject<PlaybackSyncHandle | null>;
  seekerValue: number;
  onSeekPreview: (time: number) => void;
  onSeekCommit: () => void;
  isFullscreen: boolean;
}

export default function ControlBar({
  hidden,
  me,
  volume,
  onVolumeChange,
  store,
  snapshot,
  syncHandleRef,
  seekerValue,
  onSeekPreview,
  onSeekCommit,
  isFullscreen,
}: ControlBarProps) {
  const state = store.getState();
  const playing = snapshot?.status === "playing";
  const duration = snapshot?.duration ?? 0;
  const canSeek = canControlRoom(me);
  return (
    <div
      data-testid="control-bar"
      aria-hidden={hidden || undefined}
      inert={hidden}
      className={`absolute inset-x-0 bottom-0 z-10 flex flex-col items-center justify-center gap-xs bg-gradient-to-t from-black/85 via-black/35 to-transparent px-md pb-md pt-xxl font-built transition-[opacity,transform] duration-300 motion-reduce:transition-none ${
        hidden
          ? "pointer-events-none translate-y-6 opacity-0"
          : "translate-y-0 opacity-100"
      }`}
    >
      <div className="flex w-full max-w-3xl items-center gap-sm font-mono text-xs tabular-nums text-ink-muted">
        <span>{formatPlaybackTime(seekerValue)}</span>
        <Seeker
          currentTime={seekerValue}
          duration={duration}
          disabled={!canSeek}
          onSeek={onSeekPreview}
          onSeekCommit={onSeekCommit}
        />
        <span>{formatPlaybackTime(duration)}</span>
      </div>
      <div className="relative flex w-full max-w-3xl items-center justify-center gap-md px-sm py-xs">
        <PlaybackControls me={me} playing={playing} store={state} />
        <div className="absolute right-0 hidden items-center md:flex">
          <UtilityControls
            syncHandleRef={syncHandleRef}
            volume={volume}
            onVolumeChange={onVolumeChange}
            isFullscreen={isFullscreen}
          />
        </div>
      </div>
      <div className="flex items-center md:hidden">
        <UtilityControls
          syncHandleRef={syncHandleRef}
          volume={volume}
          onVolumeChange={onVolumeChange}
          isFullscreen={isFullscreen}
        />
      </div>
    </div>
  );
}
