import type { Server, Socket } from "socket.io";
import { nanoid } from "nanoid";
import { SOCKET_EVENTS } from "../../../shared/contracts/socket-events.ts";
import { AppError } from "../../../shared/contracts/app-error.ts";
import type { ChatMessage } from "../../../shared/contracts/chat-message.ts";
import type { ChatSendPayload } from "../../../shared/contracts/payloads/chat-send-payload.ts";
import type { Logger } from "../../shared/logger/logger.ts";
import { currentRoom } from "../../shared/socket-utils.ts";

export interface ChatHandlerDeps {
  io: Server;
  logger: Logger;
  maxMessageLength?: number;
  messagesPerWindow?: number;
  windowMs?: number;
}

export class ChatHandler {
  private sendTimes = new Map<string, number[]>();
  private readonly maxMessageLength: number;
  private readonly messagesPerWindow: number;
  private readonly windowMs: number;
  private readonly io: Server;
  private readonly logger: Logger;

  constructor(deps: ChatHandlerDeps) {
    this.io = deps.io;
    this.logger = deps.logger;
    this.maxMessageLength = deps.maxMessageLength ?? 500;
    this.messagesPerWindow = deps.messagesPerWindow ?? 5;
    this.windowMs = deps.windowMs ?? 2000;
  }

  attach(): void {
    this.io.on("connection", (socket) => {
      socket.on(
        SOCKET_EVENTS.CHAT_SEND,
        (p: ChatSendPayload) => this.onSend(socket, p),
      );
      socket.on("disconnect", () => this.sendTimes.delete(socket.id));
    });
  }

  private onSend(socket: Socket, payload: ChatSendPayload): void {
    const room = currentRoom(socket);
    if (!room) return;
    const text = typeof payload?.text === "string" ? payload.text : "";
    if (text.trim() === "") return;
    if (text.length > this.maxMessageLength) {
      socket.emit(
        SOCKET_EVENTS.APP_ERROR,
        new AppError("VALIDATION_CHAT_TOO_LONG").toJSON(),
      );
      return;
    }
    if (!this.rateLimitOk(socket.id)) {
      socket.emit(
        SOCKET_EVENTS.APP_ERROR,
        new AppError("SERVER_RATE_LIMITED").toJSON(),
      );
      return;
    }
    const message: ChatMessage = {
      id: nanoid(),
      senderId: socket.id,
      senderName: payload.senderName ?? "",
      text,
      ts: Date.now(),
    };
    this.io.to(room).emit(SOCKET_EVENTS.CHAT_MESSAGE, message);
  }

  private rateLimitOk(socketId: string): boolean {
    const now = Date.now();
    const recent = (this.sendTimes.get(socketId) ?? []).filter(
      (t) => now - t < this.windowMs,
    );
    if (recent.length >= this.messagesPerWindow) {
      this.sendTimes.set(socketId, recent);
      return false;
    }
    recent.push(now);
    this.sendTimes.set(socketId, recent);
    return true;
  }
}
