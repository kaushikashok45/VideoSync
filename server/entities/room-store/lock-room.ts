import { freezeRoom } from "./freeze-room.ts";
import type { Room } from "./room.ts";

/** Reversible transition: `locked → open` remains possible via `unlockRoom`. */
export function lockRoom(room: Room): Room {
  return freezeRoom({ ...room, locked: true });
}
