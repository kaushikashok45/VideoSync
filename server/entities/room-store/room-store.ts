import { AppError } from "../../../shared/contracts/app-error.ts";
import type { Member } from "../../../shared/contracts/member.ts";
import type { MovieMetadata } from "../../../shared/contracts/movie-metadata.ts";
import type { RoomMeta } from "../../../shared/contracts/room-meta.ts";
import { addMember as addMemberTransition } from "./add-member.ts";
import { createRoom } from "./create-room.ts";
import { lockRoom as lockRoomTransition } from "./lock-room.ts";
import { removeMember as removeMemberTransition } from "./remove-member.ts";
import {
  generateRoomCode,
  isValidRoomCode,
  parseRoomCode,
  type RoomCode,
} from "./room-code.ts";
import type { Room } from "./room.ts";
import { unlockRoom as unlockRoomTransition } from "./unlock-room.ts";
import { withMetadata } from "./with-metadata.ts";

export interface RoomStoreDeps {
  maxMembers: number;
  now: () => number;
  codeLength?: number;
  createCode?: (length: number) => string;
}

export interface CreateRoomOptions {
  metadata?: MovieMetadata;
}

const DEFAULT_CODE_LENGTH = 5;

/**
 * Thin lookup table over immutable `Room` values (`docs/DECISIONS.md#ad-012`).
 * Every write path replaces the map entry with the transition function's
 * result; none ever assigns to a `Room` field.
 */
export class RoomStore {
  private rooms = new Map<RoomCode, Room>();

  constructor(private deps: RoomStoreDeps) {}

  create(hostId: string, hostName: string, opts: CreateRoomOptions = {}): Room {
    const code = this.uniqueCode();
    const room = createRoom(code, hostId, hostName, this.deps.now());
    const withMeta = withMetadata(room, opts.metadata);
    this.rooms.set(code, withMeta);
    return withMeta;
  }

  private uniqueCode(): RoomCode {
    const length = this.deps.codeLength ?? DEFAULT_CODE_LENGTH;
    const generate = this.deps.createCode ?? generateRoomCode;
    let code = parseRoomCode(generate(length), length);
    while (this.rooms.has(code)) code = parseRoomCode(generate(length), length);
    return code;
  }

  get(code: string): Room | undefined {
    const length = this.deps.codeLength ?? DEFAULT_CODE_LENGTH;
    if (!isValidRoomCode(code, length)) return undefined;
    return this.rooms.get(parseRoomCode(code, length));
  }

  getOrThrow(code: string): Room {
    const room = this.get(code);
    if (!room) throw new AppError("ROOM_NOT_FOUND");
    return room;
  }

  delete(code: RoomCode): void {
    this.rooms.delete(code);
  }

  addMember(room: Room, member: Member): Room {
    const next = addMemberTransition(room, member, this.deps.maxMembers);
    this.rooms.set(next.code, next);
    return next;
  }

  /** Validates without committing -- lets a caller check before evicting a socket's prior membership. */
  assertCanAdd(room: Room, member: Member): void {
    addMemberTransition(room, member, this.deps.maxMembers);
  }

  removeMember(room: Room, memberId: string): Member | undefined {
    const { room: next, removed } = removeMemberTransition(room, memberId);
    this.rooms.set(next.code, next);
    return removed;
  }

  lockRoom(room: Room): Room {
    const next = lockRoomTransition(room);
    this.rooms.set(next.code, next);
    return next;
  }

  unlockRoom(room: Room): Room {
    const next = unlockRoomTransition(room);
    this.rooms.set(next.code, next);
    return next;
  }

  memberCount(room: Room): number {
    return room.members.size;
  }

  toMeta(room: Room): RoomMeta {
    return {
      code: room.code,
      locked: room.locked,
      hostId: room.hostId,
      memberCount: room.members.size,
      maxMembers: this.deps.maxMembers,
      metadata: room.metadata,
    };
  }
}
