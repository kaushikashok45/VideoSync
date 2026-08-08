import {
  BackwardIcon,
  ForwardIcon,
  PauseIcon,
  PlayIcon,
} from "@heroicons/react/24/solid";
import type { Member } from "contracts/member.ts";
import { IconButton } from "~/shared/ui-kit/index.ts";
import {
  applyPlayback,
  canControlRoom,
  type PlaybackAction,
  type PlaybackCommandStore,
} from "../model/playback-behaviour.ts";

export interface PlaybackControlsProps {
  me: Member | null;
  playing: boolean;
  store: PlaybackCommandStore;
}

const BUTTON_CLASS = "h-14 w-14 transition-transform hover:scale-105";

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
        label="Rewind 10 seconds"
        disabled={!canControl}
        onClick={command("rewind")}
        className={BUTTON_CLASS}
      >
        <BackwardIcon className="size-6" />
      </IconButton>
      <IconButton
        label={playing ? "Pause" : "Play"}
        disabled={!canControl}
        onClick={command(playing ? "pause" : "play")}
        className={`${BUTTON_CLASS} bg-brand text-onbrand hover:bg-brand-hover`}
      >
        {playing
          ? <PauseIcon className="size-6" />
          : <PlayIcon className="size-6" />}
      </IconButton>
      <IconButton
        label="Forward 10 seconds"
        disabled={!canControl}
        onClick={command("forward")}
        className={BUTTON_CLASS}
      >
        <ForwardIcon className="size-6" />
      </IconButton>
    </div>
  );
}
