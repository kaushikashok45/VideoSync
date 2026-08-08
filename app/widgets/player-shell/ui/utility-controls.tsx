import { useState } from "react";
import type { RefObject } from "react";
import {
  ArrowsPointingOutIcon,
  ShareIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
} from "@heroicons/react/24/solid";
import { IconButton } from "~/shared/ui-kit/index.ts";
import type { PlaybackSyncHandle } from "./playback-sync.tsx";

export interface UtilityControlsProps {
  syncHandleRef: RefObject<PlaybackSyncHandle | null>;
  onShare?: () => void;
}

const BUTTON_CLASS = "h-14 w-14";

export default function UtilityControls({
  syncHandleRef,
  onShare,
}: UtilityControlsProps) {
  const [volume, setVolume] = useState(1);
  const muted = volume === 0;
  const applyVolume = (next: number) => {
    setVolume(next);
    syncHandleRef.current?.setVolume(next);
  };
  const toggleMute = () => applyVolume(muted ? 1 : 0);
  return (
    <div data-testid="utility-controls" className="flex items-center gap-xs">
      <IconButton
        label={muted ? "Unmute" : "Mute"}
        onClick={toggleMute}
        className={BUTTON_CLASS}
      >
        {muted
          ? <SpeakerXMarkIcon className="size-6" />
          : <SpeakerWaveIcon className="size-6" />}
      </IconButton>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={volume}
        onChange={(event) =>
          applyVolume(Number(event.target.value))}
        aria-label="Volume"
        className="w-24 accent-brand"
      />
      <IconButton
        label="Fullscreen"
        onClick={() =>
          syncHandleRef.current?.toggleFullscreen()}
        className={BUTTON_CLASS}
      >
        <ArrowsPointingOutIcon className="size-6" />
      </IconButton>
      <IconButton label="Share" onClick={onShare} className={BUTTON_CLASS}>
        <ShareIcon className="size-6" />
      </IconButton>
    </div>
  );
}
