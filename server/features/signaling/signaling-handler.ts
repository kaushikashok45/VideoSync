import type { Server, Socket } from "socket.io";
import { SOCKET_EVENTS } from "../../../shared/contracts/socket-events.ts";
import type { RelaySignalPayload } from "../../../shared/contracts/payloads/relay-signal-payload.ts";
import type { SignalPayload as SignalPayloadT } from "../../../shared/contracts/payloads/signal-payload.ts";
import type { Logger } from "../../shared/logger/logger.ts";
import { currentRoom } from "../../shared/socket-utils.ts";

export interface SignalingDeps {
  io: Server;
  logger: Logger;
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
    if (payload?.to && typeof payload.to === "string") {
      this.deps.io.to(payload.to).emit(SOCKET_EVENTS.SIGNAL, relay);
      return;
    }
    const room = currentRoom(socket);
    if (room) {
      socket.to(room).emit(SOCKET_EVENTS.SIGNAL, relay);
    }
    this.deps.logger.debug("signal relayed", { from: socket.id, room });
  }
}
