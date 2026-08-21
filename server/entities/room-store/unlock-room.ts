import { freezeRoom } from "./freeze-room.ts";
import type { Room } from "./room.ts";

/** Reversible transition: `open → locked` remains possible via `lockRoom`. */
export function unlockRoom(room: Room): Room {
  return freezeRoom({ ...room, locked: false });
}
