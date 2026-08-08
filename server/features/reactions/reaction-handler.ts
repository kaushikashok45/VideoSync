import type { Server, Socket } from "socket.io";
import { SOCKET_EVENTS } from "../../../shared/contracts/socket-events.ts";
import type { Reaction } from "../../../shared/contracts/reaction.ts";
import type { ReactionSendPayload } from "../../../shared/contracts/payloads/reaction-send-payload.ts";
import type { Logger } from "../../shared/logger/logger.ts";
import { currentRoom } from "../../shared/socket-utils.ts";

const ALLOWED_EMOJI = ["👍", "😂", "😮", "❤️", "🔥"];

export interface ReactionHandlerDeps {
  io: Server;
  logger: Logger;
}

export class ReactionHandler {
  constructor(private deps: ReactionHandlerDeps) {}

  attach(): void {
    this.deps.io.on("connection", (socket) => {
      socket.on(
        SOCKET_EVENTS.REACTION_SEND,
        (p: ReactionSendPayload) => this.onSend(socket, p),
      );
    });
  }

  private onSend(socket: Socket, payload: ReactionSendPayload): void {
    const room = currentRoom(socket);
    if (!room) return;
    const emoji = payload?.emoji;
    if (!ALLOWED_EMOJI.includes(emoji)) return;
    const reaction: Reaction = {
      senderId: socket.id,
      senderName: payload.senderName ?? "",
      emoji,
      ts: Date.now(),
    };
    this.deps.io.to(room).emit(SOCKET_EVENTS.REACTION, reaction);
  }
}
