import type { MediaSource } from "../../../shared/contracts/media-source.ts";
import type { Member } from "../../../shared/contracts/member.ts";
import type { MovieMetadata } from "../../../shared/contracts/movie-metadata.ts";
import type { PlaybackSnapshot } from "../../../shared/contracts/playback.ts";
import type { RoomCode } from "./room-code.ts";

/**
 * Immutable value. Every field `readonly`; every transition is a pure
 * function elsewhere in this directory returning a new `Room` (or throwing
 * `AppError`) rather than mutating this one -- the exemplar for the rest of
 * the entities (`docs/DECISIONS.md#ad-012`). `hostId` stays a bare `string`
 * on purpose (`docs/DECISIONS.md#ad-013`); only `code` is branded.
 */
export interface Room {
  readonly code: RoomCode;
  readonly hostId: string;
  readonly locked: boolean;
  readonly members: ReadonlyMap<string, Member>;
  readonly mediaSource: MediaSource | null;
  readonly playback: PlaybackSnapshot;
  readonly metadata?: MovieMetadata;
  readonly createdAt: number;
}
