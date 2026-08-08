import { assertEquals } from "@std/assert";
import { createRoomStore } from "./room-store.ts";
import type { RoomMeta } from "contracts/room-meta.ts";

const meta: RoomMeta = {
  code: "ABC",
  locked: false,
  hostId: "host-1",
  memberCount: 3,
  maxMembers: 15,
};

// Happy path: setRoom stores the room meta
Deno.test("setRoom stores the room meta", () => {
  const store = createRoomStore();
  store.getState().setRoom(meta);
  assertEquals(store.getState().room?.code, "ABC");
  assertEquals(store.getState().room?.hostId, "host-1");
  assertEquals(store.getState().room?.maxMembers, 15);
});

// Sad path: clearRoom nulls the room
Deno.test("clearRoom nulls the room and joined flag", () => {
  const store = createRoomStore();
  store.getState().setRoom(meta);
  store.getState().clearRoom();
  assertEquals(store.getState().room, null);
  assertEquals(store.getState().joined, false);
});

// Edge: setRoom twice replaces the previous room
Deno.test("setRoom twice replaces the previous room", () => {
  const store = createRoomStore();
  store.getState().setRoom({ ...meta, code: "AAA" });
  store.getState().setRoom({ ...meta, code: "BBB", locked: true });
  assertEquals(store.getState().room?.code, "BBB");
  assertEquals(store.getState().room?.locked, true);
  assertEquals(store.getState().room?.memberCount, 3);
});

// Mutation: joined flag flips correctly
Deno.test("joined flag flips true on setRoom and false on clearRoom", () => {
  const store = createRoomStore();
  assertEquals(store.getState().joined, false);
  store.getState().setRoom(meta);
  assertEquals(store.getState().joined, true);
  store.getState().clearRoom();
  assertEquals(store.getState().joined, false);
});

// Logical limits: setRoom preserves every meta field
Deno.test("setRoom preserves every meta field", () => {
  const store = createRoomStore();
  store.getState().setRoom(meta);
  assertEquals(store.getState().room, meta);
});
