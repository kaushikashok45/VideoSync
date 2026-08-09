import type { RefObject } from "react";
import type { Member } from "contracts/member.ts";
import type { PlaybackSnapshot } from "contracts/playback.ts";
import type { PlaybackStore } from "~/entities/playback/playback-store.ts";
import {
  applyPlayback,
  canControlRoom,
} from "~/features/playback-control/model/playback-behaviour.ts";
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
}

export default function ControlBar({
  hidden,
  me,
  volume,
  onVolumeChange,
  store,
  snapshot,
  syncHandleRef,
}: ControlBarProps) {
  const state = store.getState();
  const playing = snapshot?.status === "playing";
  const currentTime = snapshot?.currentTime ?? 0;
  const duration = snapshot?.duration ?? 0;
  const canSeek = canControlRoom(me);
  const seek = (target: number) => applyPlayback("seek", me, state, target);
  return (
    <div
      data-testid="control-bar"
      aria-hidden={hidden || undefined}
      inert={hidden}
      className={`absolute inset-x-0 bottom-0 z-10 flex flex-col gap-sm bg-gradient-to-t from-bg via-bg/80 to-transparent px-md pb-md pt-xxl font-built transition-[opacity,transform] duration-300 motion-reduce:transition-none ${
        hidden
          ? "pointer-events-none translate-y-6 opacity-0"
          : "translate-y-0 opacity-100"
      }`}
    >
      <Seeker
        currentTime={currentTime}
        duration={duration}
        disabled={!canSeek}
        onSeek={seek}
      />
      <div className="flex items-center justify-between gap-md font-mono text-xs tabular-nums text-ink-muted">
        <span>{formatPlaybackTime(currentTime)}</span>
        <span>{formatPlaybackTime(duration)}</span>
      </div>
      <div className="flex items-center justify-between gap-md">
        <PlaybackControls me={me} playing={playing} store={state} />
        <UtilityControls
          syncHandleRef={syncHandleRef}
          volume={volume}
          onVolumeChange={onVolumeChange}
        />
      </div>
    </div>
  );
}
