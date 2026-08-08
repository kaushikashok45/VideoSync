import { assertEquals } from "@std/assert";
import { SOCKET_EVENTS } from "contracts/socket-events.ts";
import type { ChatMessage } from "contracts/chat-message.ts";
import type { Member } from "contracts/member.ts";
import type { Reaction } from "contracts/reaction.ts";
import { createSocketBridge } from "./socket-bridge.tsx";
import { FakeSocketClient } from "./fake-socket-client.ts";
import {
  createRoomStore,
  type RoomStore,
} from "../../entities/room/room-store.ts";
import {
  createMembersStore,
  type MembersStore,
} from "../../entities/member/members-store.ts";
import {
  type ChatStore,
  createChatStore,
} from "../../entities/chat/chat-store.ts";
import {
  createReactionStore,
  type ReactionStore,
} from "../../entities/reaction/reaction-store.ts";
import { createErrorStore, type ErrorStore } from "./error-store.ts";

interface Stores {
  room: RoomStore;
  members: MembersStore;
  chat: ChatStore;
  reaction: ReactionStore;
  error: ErrorStore;
}

function makeStores(): Stores {
  return {
    room: createRoomStore(),
    members: createMembersStore(),
    chat: createChatStore({ maxMessages: 3 }),
    reaction: createReactionStore({ maxConcurrent: 2 }),
    error: createErrorStore(),
  };
}

function member(id: string): Member {
  return {
    id,
    name: `name-${id}`,
    role: "viewer",
    canControl: false,
    joinedAt: 1_000,
  };
}

function chatMsg(id: string): ChatMessage {
  return {
    id,
    senderId: `s-${id}`,
    senderName: "alice",
    text: `t-${id}`,
    ts: 1_000,
  };
}

function reaction(senderId: string, emoji: string): Reaction {
  return {
    senderId,
    senderName: `name-${senderId}`,
    emoji,
    ts: 1_000,
  };
}

function makeBridge(): { socket: FakeSocketClient; stores: Stores } {
  const socket = new FakeSocketClient();
  const stores = makeStores();
  createSocketBridge({ socket, stores });
  return { socket, stores };
}

// Happy: MEMBER_JOINED updates the members store
Deno.test("MEMBER_JOINED adds the member to the members store", () => {
  const { socket, stores } = makeBridge();
  socket.emit(SOCKET_EVENTS.MEMBER_JOINED, { member: member("a") });
  assertEquals(stores.members.getState().members.length, 1);
  assertEquals(stores.members.getState().members[0].id, "a");
});

// Happy: MEMBER_LEFT removes the member from the store
Deno.test("MEMBER_LEFT removes the member from the store", () => {
  const { socket, stores } = makeBridge();
  socket.emit(SOCKET_EVENTS.MEMBER_JOINED, { member: member("a") });
  socket.emit(SOCKET_EVENTS.MEMBER_LEFT, { memberId: "a" });
  assertEquals(stores.members.getState().members.length, 0);
});

// Happy: ROOM_ENDED clears the room store
Deno.test("ROOM_ENDED clears the room store", () => {
  const { socket, stores } = makeBridge();
  stores.room.getState().setRoom({
    code: "abc",
    locked: false,
    hostId: "h",
    memberCount: 1,
    maxMembers: 5,
  });
  socket.emit(SOCKET_EVENTS.ROOM_ENDED);
  assertEquals(stores.room.getState().room, null);
  assertEquals(stores.room.getState().joined, false);
});

// Sad: APP_ERROR sets the error store
Deno.test("APP_ERROR sets the error store", () => {
  const { socket, stores } = makeBridge();
  socket.emit(SOCKET_EVENTS.APP_ERROR, { code: "ROOM_FULL", message: "full" });
  assertEquals(stores.error.getState().lastError?.code, "ROOM_FULL");
});

// Edge: CHAT_MESSAGE flood drops the oldest beyond the chat cap
Deno.test("CHAT_MESSAGE flood drops the oldest beyond the cap", () => {
  const { socket, stores } = makeBridge();
  for (let i = 1; i <= 5; i++) {
    socket.emit(SOCKET_EVENTS.CHAT_MESSAGE, chatMsg(String(i)));
  }
  assertEquals(stores.chat.getState().messages.map((m) => m.id), [
    "3",
    "4",
    "5",
  ]);
});

// Mutation: duplicate MEMBER_JOINED is idempotent
Deno.test("duplicate MEMBER_JOINED is idempotent", () => {
  const { socket, stores } = makeBridge();
  socket.emit(SOCKET_EVENTS.MEMBER_JOINED, { member: member("a") });
  socket.emit(SOCKET_EVENTS.MEMBER_JOINED, { member: member("a") });
  assertEquals(stores.members.getState().members.length, 1);
});

// Limits: REACTION burst drops the oldest beyond the cap
Deno.test("REACTION burst drops the oldest beyond the cap", () => {
  const { socket, stores } = makeBridge();
  socket.emit(SOCKET_EVENTS.REACTION, reaction("a", "👍"));
  socket.emit(SOCKET_EVENTS.REACTION, reaction("b", "🔥"));
  socket.emit(SOCKET_EVENTS.REACTION, reaction("c", "❤️"));
  assertEquals(stores.reaction.getState().active.map((r) => r.senderId), [
    "b",
    "c",
  ]);
});
