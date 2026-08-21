import { AppError } from "../../../shared/contracts/app-error.ts";
import type { Member } from "../../../shared/contracts/member.ts";
import { freezeRoom } from "./freeze-room.ts";
import type { Room } from "./room.ts";

const ROOM_FULL = "ROOM_FULL";
const ROOM_LOCKED = "ROOM_LOCKED";
const ROLE_HOST = "host";

function assertHasCapacity(room: Room, maxMembers: number): void {
  if (room.members.size >= maxMembers) throw new AppError(ROOM_FULL);
}

function blocksJoin(room: Room, member: Member): boolean {
  return room.locked && member.role !== ROLE_HOST;
}

function assertAdmits(room: Room, member: Member): void {
  if (!blocksJoin(room, member)) return;
  throw new AppError(ROOM_LOCKED);
}

function withMember(room: Room, member: Member): Room {
  const members = new Map(room.members);
  members.set(member.id, member);
  return freezeRoom({ ...room, members });
}

/**
 * `ROOM-INV-1`/`ROOM-INV-2`/`ROOM-INV-3`: capacity boundary, lock semantics,
 * idempotent add. Throws `AppError` for an illegal transition without
 * touching `room` -- the input is frozen and this function never assigns
 * to any of its fields.
 */
export function addMember(
  room: Room,
  member: Member,
  maxMembers: number,
): Room {
  if (room.members.has(member.id)) return room;
  assertHasCapacity(room, maxMembers);
  assertAdmits(room, member);
  return withMember(room, member);
}
