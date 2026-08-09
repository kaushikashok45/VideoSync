import { assertEquals } from "@std/assert";
import { createPlaybackStore } from "./playback-store.ts";
import type { PlaybackSnapshot } from "contracts/playback.ts";

function paused(currentTime: number, duration = 120): PlaybackSnapshot {
  return {
    status: "paused",
    currentTime,
    duration,
    rate: 1,
    updatedAt: 100_000,
  };
}

// Happy path: play() transitions to playing and returns a projected snapshot
Deno.test("play() transitions to playing and returns a projected snapshot", () => {
  const store = createPlaybackStore({ driftThresholdMs: 1500 });
  store.getState().applyServerSnapshot(paused(0));
  const snap = store.getState().play();
  assertEquals(snap?.status, "playing");
  assertEquals(store.getState().snapshot?.status, "playing");
});

// Happy path: projectedAt projects a playing snapshot forward
Deno.test("projectedAt projects a playing snapshot forward from updatedAt", () => {
  const store = createPlaybackStore({ driftThresholdMs: 1500 });
  store.getState().applyServerSnapshot({
    status: "playing",
    currentTime: 30,
    duration: 120,
    rate: 1,
    updatedAt: 100_000,
  });
  assertEquals(store.getState().projectedAt(102_000)?.currentTime, 32);
});

// Happy path: forward/rewind step by 5 seconds from the projected position
Deno.test("forward and rewind step by 5 seconds", () => {
  const store = createPlaybackStore({ driftThresholdMs: 1500 });
  store.getState().applyServerSnapshot(paused(30));
  assertEquals(store.getState().forward()?.currentTime, 35);
  assertEquals(store.getState().rewind()?.currentTime, 30);
});

// Sad path: play() no-ops when ended or already playing
Deno.test("play() no-ops when ended or already playing", () => {
  const store = createPlaybackStore({ driftThresholdMs: 1500 });
  store.getState().applyServerSnapshot({
    status: "ended",
    currentTime: 120,
    duration: 120,
    rate: 1,
    updatedAt: 100_000,
  });
  assertEquals(store.getState().play()?.status, "ended");

  store.getState().applyServerSnapshot({
    status: "playing",
    currentTime: 30,
    duration: 120,
    rate: 1,
    updatedAt: 100_000,
  });
  assertEquals(store.getState().play()?.status, "playing");
  assertEquals(store.getState().getSnapshot()?.updatedAt, 100_000);
});

// Edge: no snapshot yet -> queries are undefined and mutations are no-ops
Deno.test("queries are undefined and mutations no-op before any snapshot", () => {
  const store = createPlaybackStore({ driftThresholdMs: 1500 });
  assertEquals(store.getState().snapshot, undefined);
  assertEquals(store.getState().getSnapshot(), undefined);
  assertEquals(store.getState().projectedAt(100_000), undefined);
  assertEquals(store.getState().play(), undefined);
  assertEquals(store.getState().pause(), undefined);
  assertEquals(store.getState().seek(10), undefined);
  assertEquals(store.getState().forward(), undefined);
  assertEquals(store.getState().rewind(), undefined);
});

// Mutation: applyServerSnapshot replaces wholesale, does not merge
Deno.test("applyServerSnapshot replaces the previous snapshot wholesale", () => {
  const store = createPlaybackStore({ driftThresholdMs: 1500 });
  store.getState().applyServerSnapshot(paused(10));
  store.getState().applyServerSnapshot({
    status: "playing",
    currentTime: 40,
    duration: 200,
    rate: 1.5,
    updatedAt: 101_000,
  });
  const snap = store.getState().getSnapshot();
  assertEquals(snap?.status, "playing");
  assertEquals(snap?.currentTime, 40);
  assertEquals(snap?.duration, 200);
  assertEquals(snap?.rate, 1.5);
  assertEquals(snap?.updatedAt, 101_000);
});

// Logical limits: seek clamps to [0, duration]
Deno.test("seek clamps to [0, duration] with exact boundaries kept", () => {
  const store = createPlaybackStore({ driftThresholdMs: 1500 });
  store.getState().applyServerSnapshot(paused(0));
  assertEquals(store.getState().seek(-5)?.currentTime, 0);
  assertEquals(store.getState().seek(120)?.currentTime, 120);
  assertEquals(store.getState().seek(500)?.currentTime, 120);
});

// Logical limits: drift threshold exactly-at is in-sync, just-beyond is not
Deno.test("driftStatus uses the exact threshold boundary", () => {
  const store = createPlaybackStore({ driftThresholdMs: 1500 });
  store.getState().applyServerSnapshot({
    status: "playing",
    currentTime: 30,
    duration: 120,
    rate: 1,
    updatedAt: 100_000,
  });
  assertEquals(store.getState().driftStatus(30_000, 100_000), "in-sync");
  assertEquals(store.getState().driftStatus(31_500, 100_000), "in-sync");
  assertEquals(store.getState().driftStatus(31_501, 100_000), "ahead");
  assertEquals(store.getState().driftStatus(28_499, 100_000), "behind");
});
