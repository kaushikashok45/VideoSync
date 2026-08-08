import { AppError } from "contracts/app-error.ts";
import type { Member } from "contracts/member.ts";

export type PlaybackAction = "play" | "pause" | "seek" | "forward" | "rewind";

export interface PlaybackCommandStore {
  play(): void;
  pause(): void;
  seek(target: number): void;
  forward(): void;
  rewind(): void;
}

export function canControlRoom(me: Member | null): boolean {
  return me !== null && (me.role === "host" || me.canControl);
}

const COMMANDS: Record<
  PlaybackAction,
  (store: PlaybackCommandStore, target: number) => void
> = {
  play: (store) => store.play(),
  pause: (store) => store.pause(),
  seek: (store, target) => store.seek(target),
  forward: (store) => store.forward(),
  rewind: (store) => store.rewind(),
};

export function applyPlayback(
  action: PlaybackAction,
  me: Member | null,
  store: PlaybackCommandStore,
  target = 0,
): void {
  if (!canControlRoom(me)) throw new AppError("ROOM_PERMISSION_DENIED");
  COMMANDS[action](store, target);
}
