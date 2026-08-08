import { assertEquals, assertRejects } from "@std/assert";
import { RoomStore } from "./room-store.ts";
import { AppError } from "../../../shared/contracts/app-error.ts";
import type { Member } from "../../../shared/contracts/member.ts";

const now = () => 1000;
const opts = { maxMembers: 15, now, codeLength: 5 };

function viewer(id: string, name: string): Member {
  return { id, name, role: "viewer", canControl: false, joinedAt: now() };
}

// Happy path
Deno.test("create stores a host-owned room and assigns a valid code", () => {
  const store = new RoomStore(opts);
  const room = store.create("sock-1", "Alice");
  assertEquals(room.hostId, "sock-1");
  assertEquals(store.get(room.code)?.hostId, "sock-1");
  assertEquals(room.members.get("sock-1")?.role, "host");
  assertEquals(room.members.get("sock-1")?.canControl, true);
  assertEquals(store.memberCount(room), 1);
});

// Sad path
Deno.test("create rejects an empty or whitespace host name", () => {
  const store = new RoomStore(opts);
  assertRejects(
    () => Promise.resolve().then(() => store.create("sock-1", "   ")),
    AppError,
    "name",
  );
});

// Sad path
Deno.test("get returns undefined for unknown or malformed codes", () => {
  const store = new RoomStore(opts);
  assertEquals(store.get("zzzzz"), undefined);
  assertEquals(store.get("!!!"), undefined);
});

// Logical limit: exactly at capacity passes, beyond throws
Deno.test("addMember enforces the exact capacity boundary", () => {
  const store = new RoomStore(opts);
  const room = store.create("host", "H");
  for (let i = 0; i < 14; i++) store.addMember(room, viewer(`v${i}`, `v${i}`));
  assertEquals(store.memberCount(room), 15); // at limit
  assertRejects(
    () =>
      Promise.resolve().then(() => store.addMember(room, viewer("extra", "x"))),
    AppError,
    "full",
  );
});

// Sad path + mutation: locking must reject new viewers but allow host
Deno.test("addMember rejects joining a locked room as a viewer, allows host", () => {
  const store = new RoomStore(opts);
  const room = store.create("host", "H");
  room.locked = true;
  assertRejects(
    () =>
      Promise.resolve().then(() => store.addMember(room, viewer("v1", "V"))),
    AppError,
    "locked",
  );
  store.addMember(room, { ...viewer("h2", "H2"), role: "host" });
  assertEquals(store.memberCount(room), 2);
});

// Edge: re-adding an existing member is a no-op (no double count)
Deno.test("addMember is idempotent for an existing member id", () => {
  const store = new RoomStore(opts);
  const room = store.create("host", "H");
  const v = viewer("v1", "V");
  store.addMember(room, v);
  store.addMember(room, v);
  assertEquals(store.memberCount(room), 2);
});

// Happy path + edge: remove returns the removed member; removing unknown is undefined
Deno.test("removeMember removes and returns the member; unknown id returns undefined", () => {
  const store = new RoomStore(opts);
  const room = store.create("host", "H");
  store.addMember(room, viewer("v1", "V"));
  assertEquals(store.removeMember(room, "v1")?.id, "v1");
  assertEquals(store.memberCount(room), 1);
  assertEquals(store.removeMember(room, "v1"), undefined);
});

// Mutation case: delete removes the room from lookup
Deno.test("delete removes the room entirely", () => {
  const store = new RoomStore(opts);
  const room = store.create("host", "H");
  store.delete(room.code);
  assertEquals(store.get(room.code), undefined);
});

// Mutation case: toMeta reflects the exact membership and flags
Deno.test("toMeta reflects membership count, lock, host, and capacity", () => {
  const store = new RoomStore(opts);
  const room = store.create("host", "H");
  store.addMember(room, viewer("v1", "V"));
  room.locked = true;
  const meta = store.toMeta(room);
  assertEquals(meta.hostId, "host");
  assertEquals(meta.memberCount, 2);
  assertEquals(meta.maxMembers, 15);
  assertEquals(meta.locked, true);
});

// Mutation case: metadata flows from create options into toMeta
Deno.test("metadata provided at create is surfaced in toMeta", () => {
  const store = new RoomStore(opts);
  const metadata = {
    title: "The Matrix",
    overview: "",
    posterUrl: "",
    backdropUrl: "",
    releaseYear: 1999,
    ageRating: "NR",
    runtime: 136,
    genres: ["Action"],
    cast: [],
  };
  const room = store.create("host", "H", { metadata });
  assertEquals(store.toMeta(room).metadata, metadata);
});

// Edge case: no metadata leaves toMeta.metadata undefined
Deno.test("toMeta omits metadata when none was provided", () => {
  const store = new RoomStore(opts);
  const room = store.create("host", "H");
  assertEquals(store.toMeta(room).metadata, undefined);
});
