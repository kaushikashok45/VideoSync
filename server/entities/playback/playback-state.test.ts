import { assertEquals } from "@std/assert";
import { PlaybackState } from "./playback-state.ts";
import type { PlaybackSnapshot } from "../../../shared/contracts/playback.ts";

function makeState(overrides: Partial<PlaybackSnapshot> = {}) {
  const t0 = 100_000;
  const initial: PlaybackSnapshot = {
    status: "paused",
    currentTime: 0,
    duration: 120,
    rate: 1,
    updatedAt: t0,
    ...overrides,
  };
  let clock = t0;
  const state = new PlaybackState(
    { now: () => clock, driftThresholdMs: 1500, seekStepSeconds: 10 },
    initial,
  );
  return { state, setTime: (t: number) => { clock = t; } };
}

// Happy path: paused does not advance
Deno.test("paused state does not advance over time", () => {
  const { state, setTime } = makeState({ status: "paused", currentTime: 30 });
  setTime(101_000);
  assertEquals(state.getSnapshot().currentTime, 30);
});

// Happy path: playing projects forward at rate
Deno.test("playing state projects currentTime forward at rate", () => {
  const { state, setTime } = makeState({ status: "playing", currentTime: 30, rate: 1 });
  setTime(102_000);
  assertEquals(state.getSnapshot().currentTime, 32);
});

// Edge: rate > 1 accelerates projection
Deno.test("rate scales the projected elapsed time", () => {
  const { state, setTime } = makeState({ status: "playing", currentTime: 30, rate: 2 });
  setTime(101_000); // +1s at 2x
  assertEquals(state.getSnapshot().currentTime, 32);
});

// Mutation case: pause freezes at the projected time, not the stored time
Deno.test("pause freezes at the projected time", () => {
  const { state, setTime } = makeState({ status: "playing", currentTime: 30 });
  setTime(101_500);
  const snap = state.pause();
  assertEquals(snap.status, "paused");
  assertEquals(snap.currentTime, 31.5);
});

// Logical limit: seek clamps to [0, duration]
Deno.test("seek clamps to duration and zero bounds", () => {
  const { state } = makeState({ status: "paused", currentTime: 30, duration: 120 });
  assertEquals(state.seek(500).currentTime, 120);
  assertEquals(state.seek(-5).currentTime, 0);
  assertEquals(state.seek(50).currentTime, 50);
});

// Happy path: forward/rewind step by configured seconds
Deno.test("forward and rewind step by configured seconds", () => {
  const { state } = makeState({ status: "paused", currentTime: 50 });
  assertEquals(state.forward().currentTime, 60);
  assertEquals(state.rewind().currentTime, 50);
});

// Mutation case: forward clamps at duration, rewind clamps at zero
Deno.test("forward/rewind respect the duration and zero bounds", () => {
  const { state } = makeState({ status: "paused", currentTime: 118, duration: 120 });
  assertEquals(state.forward().currentTime, 120);
  const zero = makeState({ status: "paused", currentTime: 3, duration: 120 });
  assertEquals(zero.state.rewind().currentTime, 0);
});

// Edge: seek while playing resumes advancing from the new position
Deno.test("playing + seek resumes advancing from the new position", () => {
  const { state, setTime } = makeState({ status: "playing", currentTime: 10 });
  setTime(100_500);
  state.seek(20);
  setTime(101_000);
  assertEquals(state.getSnapshot().currentTime, 20.5);
});

// Edge: ended state ignores play
Deno.test("play is a no-op when ended", () => {
  const { state } = makeState({ status: "ended", currentTime: 120 });
  assertEquals(state.play().status, "ended");
});

// Happy path + mutation: drift is signed and relative to authoritative position
Deno.test("drift detection reports signed difference", () => {
  const { state } = makeState({ status: "playing", currentTime: 30 });
  assertEquals(state.driftMs(28_800, 100_000), -1200);
});

// Logical limit: exactly-at-threshold acceptable, just-beyond not
Deno.test("drift acceptability respects the exact threshold", () => {
  const { state } = makeState({});
  assertEquals(state.isDriftAcceptable(1500), true);
  assertEquals(state.isDriftAcceptable(1501), false);
  assertEquals(state.isDriftAcceptable(-1500), true);
});

// Edge: setDuration updates the ceiling for projection
Deno.test("setDuration caps projection at the new duration", () => {
  const { state, setTime } = makeState({ status: "playing", currentTime: 100, duration: 120 });
  state.setDuration(101);
  setTime(102_000); // would reach 102 without the cap
  assertEquals(state.getSnapshot().currentTime, 101);
});
