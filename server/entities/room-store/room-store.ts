import { AppError } from "../../../shared/contracts/app-error.ts";
import type { Member } from "../../../shared/contracts/member.ts";
import type { PlaybackSnapshot } from "../../../shared/contracts/playback.ts";
import type { RoomMeta } from "../../../shared/contracts/room-meta.ts";
import type { Room } from "./room.ts";
import { generateRoomCode, isValidRoomCode } from "./room-code.ts";

export interface RoomStoreDeps {
  maxMembers: number;
  now: () => number;
  codeLength?: number;
  createCode?: (length: number) => string;
}

export class RoomStore {
  private rooms = new Map<string, Room>();

  constructor(private deps: RoomStoreDeps) {}

  create(hostId: string, hostName: string): Room {
    const name = hostName?.trim() ?? "";
    if (name === "") throw new AppError("VALIDATION_NAME_EMPTY");
    const code = this.uniqueCode();
    const room: Room = {
      code,
      hostId,
      locked: false,
      members: new Map(),
      mediaSource: null,
      playback: this.initialPlayback(),
      createdAt: this.deps.now(),
    };
    room.members.set(hostId, this.initialHostMember(hostId, name));
    this.rooms.set(code, room);
    return room;
  }

  private initialPlayback(): PlaybackSnapshot {
    return {
      status: "paused",
      currentTime: 0,
      duration: 0,
      rate: 1,
      updatedAt: this.deps.now(),
    };
  }

  private initialHostMember(hostId: string, name: string): Member {
    return {
      id: hostId,
      name,
      role: "host",
      canControl: true,
      joinedAt: this.deps.now(),
    };
  }

  private uniqueCode(): string {
    const length = this.deps.codeLength ?? 5;
    const generate = this.deps.createCode ?? generateRoomCode;
    let code = generate(length);
    while (this.rooms.has(code)) code = generate(length);
    return code;
  }

  get(code: string): Room | undefined {
    if (!isValidRoomCode(code, this.deps.codeLength ?? 5)) return undefined;
    return this.rooms.get(code);
  }

  getOrThrow(code: string): Room {
    const room = this.get(code);
    if (!room) throw new AppError("ROOM_NOT_FOUND");
    return room;
  }

  delete(code: string): void {
    this.rooms.delete(code);
  }

  addMember(room: Room, member: Member): void {
    if (room.members.has(member.id)) return;
    if (room.members.size >= this.deps.maxMembers) {
      throw new AppError("ROOM_FULL");
    }
    if (room.locked && member.role !== "host") {
      throw new AppError("ROOM_LOCKED");
    }
    room.members.set(member.id, member);
  }

  removeMember(room: Room, memberId: string): Member | undefined {
    const member = room.members.get(memberId);
    room.members.delete(memberId);
    return member;
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
    };
  }
}
