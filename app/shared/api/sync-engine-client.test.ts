import { assertEquals } from "@std/assert";
import { createSyncEngineClient } from "./sync-engine-client.ts";

// Happy path
Deno.test("applies a snapshot as the current sync state", () => {
  const engine = createSyncEngineClient({ driftThresholdMs: 1500 });
  engine.applySnapshot({
    status: "paused",
    currentTime: 30,
    duration: 120,
    rate: 1,
    updatedAt: 100_000,
  });
  const snap = engine.getSnapshot();
  assertEquals(snap?.status, "paused");
  assertEquals(snap?.currentTime, 30);
});

// Happy path
Deno.test("projects playing state forward from the snapshot timestamp", () => {
  const engine = createSyncEngineClient({ driftThresholdMs: 1500 });
  engine.applySnapshot({
    status: "playing",
    currentTime: 30,
    duration: 120,
    rate: 1,
    updatedAt: 100_000,
  });
  const projected = engine.projectAt(102_000);
  assertEquals(projected?.currentTime, 32);
});

// Edge: no snapshot yet -> undefined
Deno.test("projectAt and getSnapshot are undefined before any snapshot", () => {
  const engine = createSyncEngineClient({ driftThresholdMs: 1500 });
  assertEquals(engine.getSnapshot(), undefined);
  assertEquals(engine.projectAt(100_000), undefined);
});

// Logical limit: drift status exactly-at-threshold is in-sync, beyond is not
Deno.test("reports drift status against the exact threshold", () => {
  const engine = createSyncEngineClient({ driftThresholdMs: 1500 });
  engine.applySnapshot({
    status: "playing",
    currentTime: 30,
    duration: 120,
    rate: 1,
    updatedAt: 100_000,
  });
  assertEquals(engine.driftStatus(30_000, 100_000), "in-sync");
  assertEquals(engine.driftStatus(31_500, 100_000), "in-sync");
  assertEquals(engine.driftStatus(31_501, 100_000), "ahead");
  assertEquals(engine.driftStatus(28_499, 100_000), "behind");
});

// Mutation case: applying a new snapshot replaces the previous one
Deno.test("applySnapshot replaces the previous snapshot", () => {
  const engine = createSyncEngineClient({ driftThresholdMs: 1500 });
  engine.applySnapshot({
    status: "playing",
    currentTime: 10,
    duration: 120,
    rate: 1,
    updatedAt: 100_000,
  });
  engine.applySnapshot({
    status: "paused",
    currentTime: 40,
    duration: 120,
    rate: 1,
    updatedAt: 101_000,
  });
  assertEquals(engine.getSnapshot()?.currentTime, 40);
  assertEquals(engine.getSnapshot()?.status, "paused");
});
