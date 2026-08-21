import type { Server, Socket } from "socket.io";
import { SOCKET_EVENTS } from "../../../shared/contracts/socket-events.ts";
import { AppError } from "../../../shared/contracts/app-error.ts";
import type { Member } from "../../../shared/contracts/member.ts";
import type { MemberLeftPayload } from "../../../shared/contracts/payloads/member-left-payload.ts";
import type { RoomCreatePayload } from "../../../shared/contracts/payloads/room-create-payload.ts";
import type { RoomJoinPayload } from "../../../shared/contracts/payloads/room-join-payload.ts";
import type { RoomStore } from "../../entities/room-store/room-store.ts";
import type { Room } from "../../entities/room-store/room.ts";
import type { Logger } from "../../shared/logger/logger.ts";

export interface RoomHandlerDeps {
  io: Server;
  rooms: RoomStore;
  logger: Logger;
}

export class RoomHandler {
  constructor(private deps: RoomHandlerDeps) {}

  attach(): void {
    this.deps.io.on("connection", (socket) => {
      socket.on(
        SOCKET_EVENTS.ROOM_CREATE,
        (p: RoomCreatePayload) => this.onCreate(socket, p),
      );
      socket.on(
        SOCKET_EVENTS.ROOM_JOIN,
        (p: RoomJoinPayload) => this.onJoin(socket, p),
      );
      socket.on(SOCKET_EVENTS.ROOM_LOCK, () => this.onLock(socket, true));
      socket.on(SOCKET_EVENTS.ROOM_UNLOCK, () => this.onLock(socket, false));
      socket.on(SOCKET_EVENTS.ROOM_LEAVE, () => this.removeMember(socket));
      socket.on("disconnect", () => this.removeMember(socket));
    });
  }
  private onCreate(socket: Socket, payload: RoomCreatePayload): void {
    try {
      const name = payload?.name ?? "";
      if (name.trim() === "") {
        throw new AppError("VALIDATION_NAME_EMPTY");
      }
      this.removeMember(socket);
      const room = this.deps.rooms.create(socket.id, name, {
        metadata: payload?.metadata,
      });
      socket.data.roomCode = room.code;
      void socket.join(room.code);
      socket.emit(SOCKET_EVENTS.ROOM_CREATED, {
        room: this.deps.rooms.toMeta(room),
      });
      this.deps.logger.info("room created", {
        code: room.code,
        host: socket.id,
      });
    } catch (err) {
      this.emitError(socket, err);
    }
  }
  private onJoin(socket: Socket, payload: RoomJoinPayload): void {
    try {
      const code = payload?.code;
      const name = payload?.name ?? "";
      const room = this.deps.rooms.getOrThrow(code);
      if (room.locked) {
        throw new AppError("ROOM_LOCKED");
      }
      const member = this.buildViewer(socket, name);
      this.deps.rooms.assertCanAdd(room, member);
      this.removeMember(socket);
      const joined = this.deps.rooms.addMember(room, member);
      socket.data.roomCode = joined.code;
      void socket.join(joined.code);
      this.announceJoin(socket, joined, member);
      this.deps.logger.info("member joined", {
        code: joined.code,
        memberId: socket.id,
      });
    } catch (err) {
      this.emitError(socket, err);
    }
  }
  private buildViewer(socket: Socket, name: string): Member {
    return {
      id: socket.id,
      name: name.trim(),
      role: "viewer",
      canControl: false,
      joinedAt: Date.now(),
    };
  }
  private announceJoin(socket: Socket, room: Room, member: Member): void {
    socket.emit(SOCKET_EVENTS.ROOM_JOINED, {
      room: this.deps.rooms.toMeta(room),
      members: [...room.members.values()],
    });
    socket.to(room.code).emit(SOCKET_EVENTS.MEMBER_JOINED, { member });
  }
  private onLock(socket: Socket, locked: boolean): void {
    try {
      const room = this.findRoomFor(socket);
      if (!room) throw new AppError("ROOM_NOT_FOUND");
      if (room.hostId !== socket.id) {
        throw new AppError("ROOM_PERMISSION_DENIED");
      }
      this.applyLock(room, locked);
      this.deps.io.to(room.code).emit(
        locked ? SOCKET_EVENTS.ROOM_LOCKED : SOCKET_EVENTS.ROOM_UNLOCKED,
        {},
      );
    } catch (err) {
      this.emitError(socket, err);
    }
  }
  private applyLock(room: Room, locked: boolean): void {
    if (locked) {
      this.deps.rooms.lockRoom(room);
      return;
    }
    this.deps.rooms.unlockRoom(room);
  }
  private removeMember(socket: Socket): void {
    const room = this.findRoomFor(socket);
    if (!room) return;
    if (room.hostId === socket.id) {
      this.endRoom(room);
      socket.data.roomCode = undefined;
      return;
    }
    const member = this.deps.rooms.removeMember(room, socket.id);
    if (!member) return;
    void socket.leave(room.code);
    if (socket.data.roomCode === room.code) {
      socket.data.roomCode = undefined;
    }
    const memberLeft: MemberLeftPayload = { memberId: member.id };
    this.deps.io.to(room.code).emit(SOCKET_EVENTS.MEMBER_LEFT, memberLeft);
  }
  private endRoom(room: Room): void {
    this.deps.io.to(room.code).emit(SOCKET_EVENTS.ROOM_ENDED, {});
    this.deps.io.in(room.code).socketsLeave(room.code);
    this.deps.rooms.delete(room.code);
    this.deps.logger.info("room ended by host disconnect", { code: room.code });
  }
  private findRoomFor(socket: Socket) {
    const code = socket.data.roomCode;
    const room = code ? this.deps.rooms.get(code) : undefined;
    if (room) return room;
    for (const name of socket.rooms) {
      const room = this.deps.rooms.get(name);
      if (room) return room;
    }
    return undefined;
  }
  private emitError(socket: Socket, err: unknown): void {
    if (err instanceof AppError) {
      socket.emit(SOCKET_EVENTS.APP_ERROR, err.toJSON());
      return;
    }
    this.deps.logger.error("room handler error", {
      error: String(err),
      socket: socket.id,
    });
    socket.emit(
      SOCKET_EVENTS.APP_ERROR,
      new AppError("SERVER_INTERNAL").toJSON(),
    );
  }
}
