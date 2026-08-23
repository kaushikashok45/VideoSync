import { useRef } from "react";
import type { RefObject } from "react";
import { IconButton } from "~/shared/ui-kit/index.ts";
import type { PlaybackSyncHandle } from "./playback-sync.tsx";
import { Maximize2, Minimize2, Share2, Volume2, VolumeX } from "lucide-react";

export interface UtilityControlsProps {
  syncHandleRef: RefObject<PlaybackSyncHandle | null>;
  volume: number;
  onVolumeChange: (volume: number) => void;
  onShare?: () => void;
  isFullscreen?: boolean;
}

const BUTTON_CLASS =
  "h-11 w-11 text-white/80 hover:bg-white/10 hover:text-white";

export default function UtilityControls({
  syncHandleRef,
  volume,
  onVolumeChange,
  onShare,
  isFullscreen = false,
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
      <div className="group flex items-center gap-xs">
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
          onInput={(event) =>
            applyVolume(Number(event.currentTarget.value))}
          onChange={(event) =>
            applyVolume(Number(event.target.value))}
          aria-label="Volume"
          className="w-0 overflow-hidden opacity-0 transition-[width,opacity] duration-200 group-hover:w-24 group-hover:opacity-100 group-focus-within:w-24 group-focus-within:opacity-100 accent-white motion-reduce:transition-none"
        />
        <output
          aria-label="Volume level"
          className="w-0 overflow-hidden whitespace-nowrap font-mono text-[10px] tabular-nums text-white/70 opacity-0 transition-[width,opacity] duration-200 group-hover:w-8 group-hover:opacity-100 group-focus-within:w-8 group-focus-within:opacity-100 motion-reduce:transition-none"
        >
          {Math.round(volume * 100)}%
        </output>
      </div>
      <IconButton
        label={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
        onClick={() => syncHandleRef.current?.toggleFullscreen()}
        className={BUTTON_CLASS}
      >
        {isFullscreen
          ? <Minimize2 className="size-6" />
          : <Maximize2 className="size-6" />}
      </IconButton>
      <IconButton label="Share" onClick={onShare} className={BUTTON_CLASS}>
        <Share2 className="size-6" />
      </IconButton>
    </div>
  );
}
