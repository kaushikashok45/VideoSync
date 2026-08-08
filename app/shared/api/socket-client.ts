import { io, type Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "contracts/socket-events.ts";
import { AppError } from "contracts/app-error.ts";
import type { AppErrorPayload } from "contracts/app-error-payload.ts";
import type { ErrorCode } from "contracts/error-code.ts";
import type { ChatMessage } from "contracts/chat-message.ts";
import type { MemberJoinedPayload } from "contracts/payloads/member-joined-payload.ts";
import type { MemberLeftPayload } from "contracts/payloads/member-left-payload.ts";
import type { Reaction } from "contracts/reaction.ts";
import type { RelaySignalPayload } from "contracts/payloads/relay-signal-payload.ts";
import type { RoomCreatePayload } from "contracts/payloads/room-create-payload.ts";
import type { RoomCreatedPayload } from "contracts/payloads/room-created-payload.ts";
import type { RoomJoinPayload } from "contracts/payloads/room-join-payload.ts";
import type { RoomJoinedPayload } from "contracts/payloads/room-joined-payload.ts";
import type { RoomMeta } from "contracts/room-meta.ts";
import type { SignalPayload } from "contracts/payloads/signal-payload.ts";
import type { ControlGrantPayload } from "contracts/payloads/control-grant-payload.ts";
import type { ControlRevokePayload } from "contracts/payloads/control-revoke-payload.ts";

export interface SocketClientDeps {
  url: string;
}

export interface SocketClient {
  createRoom(name: string): Promise<RoomMeta>;
  joinRoom(code: string, name: string): Promise<RoomJoinedPayload>;
  sendChat(text: string): void;
  sendReaction(emoji: string): void;
  grantControl(targetId: string): void;
  revokeControl(targetId: string): void;
  sendSignal(to: string, signalData: unknown): void;
  onMemberJoined(cb: (p: MemberJoinedPayload) => void): void | (() => void);
  onMemberLeft(cb: (p: MemberLeftPayload) => void): void | (() => void);
  onChatMessage(cb: (m: ChatMessage) => void): void | (() => void);
  onReaction(cb: (r: Reaction) => void): void | (() => void);
  onSignal(cb: (p: RelaySignalPayload) => void): void | (() => void);
  onRoomEnded(cb: () => void): void | (() => void);
  onAppError(cb: (p: AppErrorPayload) => void): void | (() => void);
  getSocketId(): string | undefined;
  disconnect(): void;
}

export function createSocketClient(deps: SocketClientDeps): SocketClient {
  const socket: Socket = io(deps.url, {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  const pending = new Map<string, (payload: unknown) => void>();
  socket.on(SOCKET_EVENTS.ROOM_CREATED, (p: unknown) => {
    pending.get("create")?.(p);
    pending.delete("create");
  });
  socket.on(SOCKET_EVENTS.ROOM_JOINED, (p: unknown) => {
    pending.get("join")?.(p);
    pending.delete("join");
  });
  socket.on(SOCKET_EVENTS.APP_ERROR, (err: AppErrorPayload) => {
    const reject = pending.get("error");
    pending.clear();
    reject?.(new AppError(err.code as ErrorCode));
  });

  function request<T>(key: string, payload: unknown): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      pending.set("error", reject);
      pending.set(key, (p: unknown) => resolve(p as T));
      socket.emit(
        key === "create" ? SOCKET_EVENTS.ROOM_CREATE : SOCKET_EVENTS.ROOM_JOIN,
        payload,
      );
    });
  }

  return {
    createRoom(name) {
      const payload: RoomCreatePayload = { name };
      return request<RoomCreatedPayload>("create", payload).then((p) => p.room);
    },
    joinRoom(code, name) {
      const payload: RoomJoinPayload = { code, name };
      return request<RoomJoinedPayload>("join", payload);
    },
    sendChat(text) {
      socket.emit(SOCKET_EVENTS.CHAT_SEND, { text, senderName: "" });
    },
    sendReaction(emoji) {
      socket.emit(SOCKET_EVENTS.REACTION_SEND, { emoji, senderName: "" });
    },
    grantControl(targetId) {
      const payload: ControlGrantPayload = { targetId };
      socket.emit(SOCKET_EVENTS.CONTROL_GRANT, payload);
    },
    revokeControl(targetId) {
      const payload: ControlRevokePayload = { targetId };
      socket.emit(SOCKET_EVENTS.CONTROL_REVOKE, payload);
    },
    sendSignal(to, signalData) {
      const payload: SignalPayload = { to, signalData };
      socket.emit(SOCKET_EVENTS.SIGNAL, payload);
    },
    onMemberJoined(cb) {
      socket.on(SOCKET_EVENTS.MEMBER_JOINED, cb);
      return () => socket.off(SOCKET_EVENTS.MEMBER_JOINED, cb);
    },
    onMemberLeft(cb) {
      socket.on(SOCKET_EVENTS.MEMBER_LEFT, cb);
      return () => socket.off(SOCKET_EVENTS.MEMBER_LEFT, cb);
    },
    onChatMessage(cb) {
      socket.on(SOCKET_EVENTS.CHAT_MESSAGE, cb);
      return () => socket.off(SOCKET_EVENTS.CHAT_MESSAGE, cb);
    },
    onReaction(cb) {
      socket.on(SOCKET_EVENTS.REACTION, cb);
      return () => socket.off(SOCKET_EVENTS.REACTION, cb);
    },
    onSignal(cb) {
      socket.on(SOCKET_EVENTS.SIGNAL, cb);
      return () => socket.off(SOCKET_EVENTS.SIGNAL, cb);
    },
    onRoomEnded(cb) {
      socket.on(SOCKET_EVENTS.ROOM_ENDED, cb);
      return () => socket.off(SOCKET_EVENTS.ROOM_ENDED, cb);
    },
    onAppError(cb) {
      socket.on(SOCKET_EVENTS.APP_ERROR, cb);
      return () => socket.off(SOCKET_EVENTS.APP_ERROR, cb);
    },
    getSocketId: () => socket.id,
    disconnect: () => socket.disconnect(),
  };
}
