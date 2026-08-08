import type { Server, Socket } from "socket.io";
import { SOCKET_EVENTS } from "../../../shared/contracts/socket-events.ts";
import { AppError } from "../../../shared/contracts/app-error.ts";
import type { Member } from "../../../shared/contracts/member.ts";
import type { MemberJoinedPayload } from "../../../shared/contracts/payloads/member-joined-payload.ts";
import type { MemberLeftPayload } from "../../../shared/contracts/payloads/member-left-payload.ts";
import type { RoomCreatePayload } from "../../../shared/contracts/payloads/room-create-payload.ts";
import type { RoomCreatedPayload } from "../../../shared/contracts/payloads/room-created-payload.ts";
import type { RoomJoinPayload } from "../../../shared/contracts/payloads/room-join-payload.ts";
import type { RoomJoinedPayload } from "../../../shared/contracts/payloads/room-joined-payload.ts";
import type { RoomStore } from "../../entities/room-store/room-store.ts";
import type { Logger } from "../../shared/logger/logger.ts";

export interface RoomHandlerDeps {
  io: Server;
  rooms: RoomStore;
  logger: Logger;
}

export class RoomHandler {
  constructor(private deps: RoomHandlerDeps) {}

  attach(): void {
    this.deps.io.on("connection", (socket) => this.onConnection(socket));
  }

  private onConnection(socket: Socket): void {
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
    socket.on(SOCKET_EVENTS.ROOM_LEAVE, () => this.onLeave(socket));
    socket.on("disconnect", () => this.onDisconnect(socket));
  }

  private onCreate(socket: Socket, payload: RoomCreatePayload): void {
    try {
      const room = this.deps.rooms.create(socket.id, payload?.name ?? "");
      socket.data.roomCode = room.code;
      void socket.join(room.code);
      const created: RoomCreatedPayload = {
        room: this.deps.rooms.toMeta(room),
      };
      socket.emit(SOCKET_EVENTS.ROOM_CREATED, created);
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
      const member: Member = {
        id: socket.id,
        name: name.trim(),
        role: "viewer",
        canControl: false,
        joinedAt: Date.now(),
      };
      this.deps.rooms.addMember(room, member);
      socket.data.roomCode = room.code;
      void socket.join(room.code);
      const joined: RoomJoinedPayload = {
        room: this.deps.rooms.toMeta(room),
        members: [...room.members.values()],
      };
      socket.emit(SOCKET_EVENTS.ROOM_JOINED, joined);
      const memberJoined: MemberJoinedPayload = { member };
      socket.to(room.code).emit(SOCKET_EVENTS.MEMBER_JOINED, memberJoined);
      this.deps.logger.info("member joined", {
        code: room.code,
        memberId: socket.id,
      });
    } catch (err) {
      this.emitError(socket, err);
    }
  }

  private onLock(socket: Socket, locked: boolean): void {
    try {
      const room = this.findRoomFor(socket);
      if (!room) throw new AppError("ROOM_NOT_FOUND");
      if (room.hostId !== socket.id) {
        throw new AppError("ROOM_PERMISSION_DENIED");
      }
      room.locked = locked;
      this.deps.io
        .to(room.code)
        .emit(
          locked ? SOCKET_EVENTS.ROOM_LOCKED : SOCKET_EVENTS.ROOM_UNLOCKED,
          {},
        );
    } catch (err) {
      this.emitError(socket, err);
    }
  }

  private onLeave(socket: Socket): void {
    this.removeMember(socket);
  }

  private onDisconnect(socket: Socket): void {
    this.removeMember(socket);
  }

  private removeMember(socket: Socket): void {
    const room = this.findRoomFor(socket);
    if (!room) return;
    if (room.hostId === socket.id) {
      this.deps.io.to(room.code).emit(SOCKET_EVENTS.ROOM_ENDED, {});
      this.deps.rooms.delete(room.code);
      this.deps.logger.info("room ended by host disconnect", {
        code: room.code,
      });
      return;
    }
    const member = this.deps.rooms.removeMember(room, socket.id);
    if (!member) return;
    const memberLeft: MemberLeftPayload = { memberId: member.id };
    this.deps.io.to(room.code).emit(SOCKET_EVENTS.MEMBER_LEFT, memberLeft);
  }

  private findRoomFor(socket: Socket) {
    const code = socket.data.roomCode;
    if (code) {
      const room = this.deps.rooms.get(code);
      if (room) return room;
    }
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
