import { useRef } from "react";
import type { RefObject } from "react";
import { IconButton } from "~/shared/ui-kit/index.ts";
import type { PlaybackSyncHandle } from "./playback-sync.tsx";
import { Maximize2, Share2, Volume2, VolumeX } from "lucide-react";

export interface UtilityControlsProps {
  syncHandleRef: RefObject<PlaybackSyncHandle | null>;
  volume: number;
  onVolumeChange: (volume: number) => void;
  onShare?: () => void;
}

const BUTTON_CLASS = "h-11 w-11";

export default function UtilityControls({
  syncHandleRef,
  volume,
  onVolumeChange,
  onShare,
}: UtilityControlsProps) {
  const lastAudibleVolumeRef = useRef(1);
  const muted = volume === 0;
  const applyVolume = (next: number) => {
    if (next > 0) lastAudibleVolumeRef.current = next;
    onVolumeChange(next);
    syncHandleRef.current?.setVolume(next);
  };
  const toggleMute = () =>
    applyVolume(muted ? lastAudibleVolumeRef.current : 0);
  return (
    <div data-testid="utility-controls" className="flex items-center gap-xs">
      <IconButton
        label={muted ? "Unmute" : "Mute"}
        onClick={toggleMute}
        className={BUTTON_CLASS}
      >
        {muted
          ? <VolumeX className="size-6" />
          : <Volume2 className="size-6" />}
      </IconButton>
      <input
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={volume}
        onInput={(event) => applyVolume(Number(event.currentTarget.value))}
        onChange={(event) => applyVolume(Number(event.target.value))}
        aria-label="Volume"
        className="w-24 accent-brand"
      />
      <IconButton
        label="Fullscreen"
        onClick={() => syncHandleRef.current?.toggleFullscreen()}
        className={BUTTON_CLASS}
      >
        <Maximize2 className="size-6" />
      </IconButton>
      <IconButton label="Share" onClick={onShare} className={BUTTON_CLASS}>
        <Share2 className="size-6" />
      </IconButton>
    </div>
  );
}
