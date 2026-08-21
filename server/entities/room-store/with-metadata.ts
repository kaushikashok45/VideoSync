import type { MovieMetadata } from "../../../shared/contracts/movie-metadata.ts";
import { freezeRoom } from "./freeze-room.ts";
import type { Room } from "./room.ts";

/** Attaches optional TMDB metadata at creation time. Always returns a fresh, frozen `Room`. */
export function withMetadata(
  room: Room,
  metadata: MovieMetadata | undefined,
): Room {
  return freezeRoom({ ...room, metadata });
}
