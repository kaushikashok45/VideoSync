import type { KeyboardEvent } from "react";
import type { Member } from "contracts/member.ts";
import type { PlaybackSnapshot } from "contracts/playback.ts";
import type { PlaybackStore } from "~/entities/playback/playback-store.ts";
import {
  LARGE_SEEK_SECONDS,
  SMALL_SEEK_SECONDS,
} from "~/entities/playback/seek-seconds.ts";
import { canControlRoom } from "./playback-behaviour.ts";

export function handleStagePlaybackShortcut(
  event: KeyboardEvent<HTMLDivElement>,
  me: Member | null,
  snapshot: PlaybackSnapshot | undefined,
  store: PlaybackStore,
): void {
  if (event.target !== event.currentTarget || !canControlRoom(me)) return;
  const projected = store.getState().projectedAt(Date.now()) ?? snapshot;
  if (event.key === "Home" || event.key === "End") {
    event.preventDefault();
    store.getState().seek(event.key === "Home" ? 0 : projected?.duration ?? 0);
    return;
  }
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  event.preventDefault();
  const delta = event.shiftKey ? LARGE_SEEK_SECONDS : SMALL_SEEK_SECONDS;
  store.getState().seek(
    (projected?.currentTime ?? 0) +
      (event.key === "ArrowRight" ? delta : -delta),
  );
}
