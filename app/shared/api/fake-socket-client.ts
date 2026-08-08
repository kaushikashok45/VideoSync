import { SOCKET_EVENTS } from "contracts/socket-events.ts";
import type { AppErrorPayload } from "contracts/app-error-payload.ts";
import type { ChatMessage } from "contracts/chat-message.ts";
import type { MemberJoinedPayload } from "contracts/payloads/member-joined-payload.ts";
import type { MemberLeftPayload } from "contracts/payloads/member-left-payload.ts";
import type { Reaction } from "contracts/reaction.ts";
import type { RelaySignalPayload } from "contracts/payloads/relay-signal-payload.ts";
import type { RoomJoinedPayload } from "contracts/payloads/room-joined-payload.ts";
import type { RoomMeta } from "contracts/room-meta.ts";
import type { SocketClient } from "./socket-client.ts";

type Handler = (payload: unknown) => void;

export class FakeSocketClient implements SocketClient {
  private handlers = new Map<string, Handler[]>();

  emit(event: string, payload?: unknown): void {
    for (const handler of this.handlers.get(event) ?? []) {
      handler(payload);
    }
  }

  private on(event: string, handler: Handler): void {
    const list = this.handlers.get(event) ?? [];
    list.push(handler);
    this.handlers.set(event, list);
  }

  onMemberJoined(cb: (p: MemberJoinedPayload) => void): void {
    this.on(SOCKET_EVENTS.MEMBER_JOINED, cb as Handler);
  }

  onMemberLeft(cb: (p: MemberLeftPayload) => void): void {
    this.on(SOCKET_EVENTS.MEMBER_LEFT, cb as Handler);
  }

  onChatMessage(cb: (m: ChatMessage) => void): void {
    this.on(SOCKET_EVENTS.CHAT_MESSAGE, cb as Handler);
  }

  onReaction(cb: (r: Reaction) => void): void {
    this.on(SOCKET_EVENTS.REACTION, cb as Handler);
  }

  onSignal(cb: (p: RelaySignalPayload) => void): void {
    this.on(SOCKET_EVENTS.SIGNAL, cb as Handler);
  }

  onRoomEnded(cb: () => void): void {
    this.on(SOCKET_EVENTS.ROOM_ENDED, cb as Handler);
  }

  onAppError(cb: (p: AppErrorPayload) => void): void {
    this.on(SOCKET_EVENTS.APP_ERROR, cb as Handler);
  }

  createRoom(_name: string): Promise<RoomMeta> {
    return Promise.reject(new Error("not implemented"));
  }

  joinRoom(_code: string, _name: string): Promise<RoomJoinedPayload> {
    return Promise.reject(new Error("not implemented"));
  }

  sendChat(_text: string): void {}

  sendReaction(_emoji: string): void {}

  grantControl(_targetId: string): void {}

  revokeControl(_targetId: string): void {}

  sendSignal(_to: string, _signalData: unknown): void {}

  getSocketId(): string | undefined {
    return "fake";
  }

  disconnect(): void {}
}
