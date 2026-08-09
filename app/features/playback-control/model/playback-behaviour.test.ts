import { assertEquals } from "@std/assert";
import { AppError } from "contracts/app-error.ts";
import type { Member } from "contracts/member.ts";
import { createPlaybackStore } from "~/entities/playback/playback-store.ts";
import {
  applyPlayback,
  canControlRoom,
  type PlaybackCommandStore,
} from "./playback-behaviour.ts";

function member(overrides: Partial<Member> = {}): Member {
  return {
    id: "me",
    name: "Me",
    role: "viewer",
    canControl: false,
    joinedAt: 0,
    ...overrides,
  };
}

function spyStore(): { store: PlaybackCommandStore; calls: string[] } {
  const calls: string[] = [];
  const record = (name: string) => () => {
    calls.push(name);
  };
  const store: PlaybackCommandStore = {
    play: record("play"),
    pause: record("pause"),
    seek: (t: number) => {
      calls.push(`seek:${t}`);
    },
    forward: record("forward"),
    rewind: record("rewind"),
  };
  return { store, calls };
}

function denied(fn: () => void): AppError {
  try {
    fn();
  } catch (err) {
    return err as AppError;
  }
  throw new Error("expected a typed AppError");
}

const paused = (currentTime: number, duration = 120) => ({
  status: "paused" as const,
  currentTime,
  duration,
  rate: 1,
  updatedAt: 100_000,
});

// 1. Happy path: host and conductor can control; every action maps to the store.
Deno.test("canControlRoom is true for the host or a conductor", () => {
  assertEquals(canControlRoom(member({ role: "host" })), true);
  assertEquals(canControlRoom(member({ canControl: true })), true);
});

Deno.test("applyPlayback maps every action onto the store call", () => {
  const host = member({ role: "host" });
  applyPlayback("play", host, spyStore().store);
  const { store, calls } = spyStore();
  applyPlayback("pause", host, store);
  applyPlayback("seek", host, store, 42);
  applyPlayback("forward", host, store);
  applyPlayback("rewind", host, store);
  assertEquals(calls, ["pause", "seek:42", "forward", "rewind"]);
});

// 2. Sad path: a plain viewer cannot control; actions throw before touching the store.
Deno.test("a plain viewer cannot control and actions throw a typed AppError", () => {
  const viewer = member();
  assertEquals(canControlRoom(viewer), false);
  const { store, calls } = spyStore();
  assertEquals(
    denied(() => applyPlayback("play", viewer, store)).code,
    "ROOM_PERMISSION_DENIED",
  );
  assertEquals(calls, []);
});

// 3. Edge case: me null never grants control.
Deno.test("canControlRoom is false when me is null", () => {
  assertEquals(canControlRoom(null), false);
  assertEquals(
    denied(() => applyPlayback("play", null, spyStore().store)).code,
    "ROOM_PERMISSION_DENIED",
  );
});

// 4. Mutation pins: host OR canControl (not host AND canControl, not role alone).
Deno.test("permission matrix is host-or-canControl, not host-and-canControl", () => {
  const { store: hostStore, calls: hostCalls } = spyStore();
  applyPlayback("play", member({ role: "host", canControl: false }), hostStore);
  assertEquals(hostCalls, ["play"]);
  const { store: conductorStore, calls: conductorCalls } = spyStore();
  applyPlayback("pause", member({ canControl: true }), conductorStore);
  assertEquals(conductorCalls, ["pause"]);
});

Deno.test("forward and rewind step by exactly 5 seconds through the store", () => {
  const host = member({ role: "host" });
  const store = createPlaybackStore({ driftThresholdMs: 1500 });
  store.getState().applyServerSnapshot(paused(30));
  applyPlayback("forward", host, store.getState());
  assertEquals(store.getState().snapshot?.currentTime, 35);
  applyPlayback("rewind", host, store.getState());
  assertEquals(store.getState().snapshot?.currentTime, 30);
});

// 5. Logical limits: seek clamps to [0, duration]; the raw target reaches the store.
Deno.test("seek clamps to [0, duration] with exact boundaries kept", () => {
  const host = member({ role: "host" });
  const store = createPlaybackStore({ driftThresholdMs: 1500 });
  store.getState().applyServerSnapshot(paused(0));
  applyPlayback("seek", host, store.getState(), 500);
  assertEquals(store.getState().snapshot?.currentTime, 120);
  applyPlayback("seek", host, store.getState(), -5);
  assertEquals(store.getState().snapshot?.currentTime, 0);
});

Deno.test("applyPlayback passes the seek target through to the store", () => {
  const host = member({ role: "host" });
  const { store, calls } = spyStore();
  applyPlayback("seek", host, store, 41.5);
  assertEquals(calls, ["seek:41.5"]);
});
