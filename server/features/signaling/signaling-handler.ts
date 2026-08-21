import type { Server, Socket } from "socket.io";
import { SOCKET_EVENTS } from "../../../shared/contracts/socket-events.ts";
import type { RelaySignalPayload } from "../../../shared/contracts/payloads/relay-signal-payload.ts";
import type { SignalPayload as SignalPayloadT } from "../../../shared/contracts/payloads/signal-payload.ts";
import { AppError } from "../../../shared/contracts/app-error.ts";
import type { Logger } from "../../shared/logger/logger.ts";
import { currentRoom } from "../../shared/socket-utils.ts";

export interface SignalingDeps {
  io: Server;
  logger: Logger;
}

/** Normalises a client-supplied target id; anything not a string is no target at all. */
function targetId(payload: SignalPayloadT): string | undefined {
  const to = payload?.to;
  return typeof to === "string" ? to : undefined;
}

export class SignalingHandler {
  constructor(private deps: SignalingDeps) {}

  attach(): void {
    this.deps.io.on("connection", (socket) => this.onConnection(socket));
  }

  private onConnection(socket: Socket): void {
    socket.emit(SOCKET_EVENTS.SOCKET_ID_META, { peerId: socket.id });
    socket.on(
      SOCKET_EVENTS.SIGNAL,
      (payload: SignalPayloadT) => this.onSignal(socket, payload),
    );
  }

  private onSignal(socket: Socket, payload: SignalPayloadT): void {
    const relay: RelaySignalPayload = {
      peerId: socket.id,
      signalData: payload?.signalData,
    };
    const to = targetId(payload);
    if (to) {
      this.relayTargeted(socket, to, relay);
      return;
    }
    this.relayToRoom(socket, relay);
  }

  /**
   * Resolves the room a socket belongs to from **server-side state**.
   *
   * ARCH-004: the room a signal may cross into is never taken from client input.
   * `io.to(<socketId>)` addresses that socket directly, because socket.io auto-joins
   * every socket to a room named after its own id -- so an unchecked client-supplied
   * target reaches any socket on the server, in any room.
   */
  private roomOf(socketId: string): string | undefined {
    const target = this.deps.io.sockets.sockets.get(socketId);
    return target ? currentRoom(target) : undefined;
  }

  /** True only when the target is in the sender's room, both resolved server-side. */
  private sharesSenderRoom(socket: Socket, target: string): boolean {
    const senderRoom = currentRoom(socket);
    return senderRoom !== undefined && senderRoom === this.roomOf(target);
  }

  private relayTargeted(
    socket: Socket,
    to: string,
    relay: RelaySignalPayload,
  ): void {
    if (this.sharesSenderRoom(socket, to)) {
      this.deps.io.to(to).emit(SOCKET_EVENTS.SIGNAL, relay);
      return;
    }
    this.refuseCrossRoom(socket, to);
  }

  /**
   * Refuses a relay whose target is outside the sender's room, with a typed error.
   *
   * `ROOM_PERMISSION_DENIED` is reused deliberately rather than adding a new code:
   * `shared/contracts/` is the contract between two independently deployed halves and
   * carries no protocol version (ARCH-009), so a new `ErrorCode` would reach clients
   * that have never heard of it. Refusal is logged at error level because a cross-room
   * signal attempt is not routine client behaviour.
   */
  private refuseCrossRoom(socket: Socket, to: string): void {
    this.deps.logger.error("cross-room signal refused", {
      from: socket.id,
      to,
      room: currentRoom(socket),
    });
    socket.emit(
      SOCKET_EVENTS.APP_ERROR,
      new AppError("ROOM_PERMISSION_DENIED").toJSON(),
    );
  }

  private relayToRoom(socket: Socket, relay: RelaySignalPayload): void {
    const room = currentRoom(socket);
    if (room) socket.to(room).emit(SOCKET_EVENTS.SIGNAL, relay);
    this.deps.logger.debug("signal relayed", { from: socket.id, room });
  }
}
