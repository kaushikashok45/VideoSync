import type { Room } from "./room.ts";

/**
 * `readonly` fields are compile-time only; a caller without type-checking
 * (or a stray cast) could still write to a plain object. Every `Room`
 * factory/transition routes its result through this so immutability is a
 * runtime guarantee too, not just a lint-time one.
 */
export function freezeRoom(room: Room): Room {
  return Object.freeze(room);
}
