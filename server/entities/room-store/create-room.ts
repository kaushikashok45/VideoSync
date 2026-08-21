import { AppError } from "../../../shared/contracts/app-error.ts";
import type { Member } from "../../../shared/contracts/member.ts";
import type { PlaybackSnapshot } from "../../../shared/contracts/playback.ts";
import { freezeRoom } from "./freeze-room.ts";
import type { Room } from "./room.ts";
import type { RoomCode } from "./room-code.ts";

const VALIDATION_NAME_EMPTY = "VALIDATION_NAME_EMPTY";
const ROLE_HOST = "host";
const STATUS_PAUSED = "paused";
const NO_MEDIA_SOURCE = null;

function assertHostName(name: string): void {
  if (name === "") throw new AppError(VALIDATION_NAME_EMPTY);
}

function buildHostMember(hostId: string, name: string, now: number): Member {
  return { id: hostId, name, role: ROLE_HOST, canControl: true, joinedAt: now };
}

function initialPlayback(now: number): PlaybackSnapshot {
  return {
    status: STATUS_PAUSED,
    currentTime: 0,
    duration: 0,
    rate: 1,
    updatedAt: now,
  };
}

/**
 * The factory: enforces `ROOM-INV-4`/`ROOM-INV-5` and returns a frozen,
 * host-owned `Room` or throws `AppError`. Metadata is attached separately
 * by `withMetadata` (`with-metadata.ts`) to keep this function's parameter
 * count at the server-code limit.
 */
export function createRoom(
  code: RoomCode,
  hostId: string,
  hostName: string,
  now: number,
): Room {
  const name = hostName.trim();
  assertHostName(name);
  const host = buildHostMember(hostId, name, now);
  return freezeRoom({
    code,
    hostId,
    locked: false,
    members: new Map([[host.id, host]]),
    mediaSource: NO_MEDIA_SOURCE,
    playback: initialPlayback(now),
    createdAt: now,
  });
}
