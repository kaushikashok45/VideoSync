import type { Member } from "contracts/member.ts";
import { IconButton } from "~/shared/ui-kit/index.ts";
import {
  applyPlayback,
  canControlRoom,
  type PlaybackAction,
  type PlaybackCommandStore,
} from "../model/playback-behaviour.ts";
import { SMALL_SEEK_SECONDS } from "~/entities/playback/seek-seconds.ts";
import { Pause, Play, RotateCcw, RotateCw } from "lucide-react";

export interface PlaybackControlsProps {
  me: Member | null;
  playing: boolean;
  store: PlaybackCommandStore;
}

const BUTTON_CLASS =
  "relative h-14 w-14 text-white/80 transition-transform hover:scale-105 hover:text-white";

export default function PlaybackControls({
  me,
  playing,
  store,
}: PlaybackControlsProps) {
  const canControl = canControlRoom(me);
  const command = (action: PlaybackAction) => () => {
    applyPlayback(action, me, store);
  };
  return (
    <div data-testid="playback-controls" className="flex items-center gap-xs">
      <IconButton
        label={`Rewind ${SMALL_SEEK_SECONDS} seconds`}
        disabled={!canControl}
        onClick={command("rewind")}
        className={BUTTON_CLASS}
      >
        <RotateCcw className="size-6" />
        <span className="pointer-events-none absolute text-[9px] font-semibold">
          10
        </span>
      </IconButton>
      <IconButton
        label={playing ? "Pause" : "Play"}
        disabled={!canControl}
        onClick={command(playing ? "pause" : "play")}
        className={`${BUTTON_CLASS} bg-brand text-onbrand hover:bg-brand-hover`}
      >
        {playing ? <Pause className="size-6" /> : <Play className="size-6" />}
      </IconButton>
      <IconButton
        label={`Forward ${SMALL_SEEK_SECONDS} seconds`}
        disabled={!canControl}
        onClick={command("forward")}
        className={BUTTON_CLASS}
      >
        <RotateCw className="size-6" />
        <span className="pointer-events-none absolute text-[9px] font-semibold">
          10
        </span>
      </IconButton>
    </div>
  );
}
