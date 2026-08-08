import type { PlaybackSnapshot } from "contracts/playback.ts";

export interface SyncEngineClientDeps {
  driftThresholdMs: number;
}

export interface SyncEngineClient {
  applySnapshot(snapshot: PlaybackSnapshot): void;
  getSnapshot(): PlaybackSnapshot | undefined;
  projectAt(now: number): PlaybackSnapshot | undefined;
  driftStatus(
    viewerPositionMs: number,
    now: number,
  ): "in-sync" | "behind" | "ahead";
}

export function createSyncEngineClient(
  deps: SyncEngineClientDeps,
): SyncEngineClient {
  let snapshot: PlaybackSnapshot | undefined;

  function projectAt(now: number): PlaybackSnapshot | undefined {
    if (!snapshot) return undefined;
    if (snapshot.status !== "playing") return snapshot;
    const elapsed = Math.max(0, (now - snapshot.updatedAt) / 1000) *
      snapshot.rate;
    const duration = snapshot.duration || Number.POSITIVE_INFINITY;
    return {
      ...snapshot,
      currentTime: Math.min(snapshot.currentTime + elapsed, duration),
    };
  }

  function driftStatus(
    viewerPositionMs: number,
    now: number,
  ): "in-sync" | "behind" | "ahead" {
    const authoritative = projectAt(now);
    if (!authoritative) return "in-sync";
    const diff = viewerPositionMs - authoritative.currentTime * 1000;
    if (Math.abs(diff) <= deps.driftThresholdMs) return "in-sync";
    return diff < 0 ? "behind" : "ahead";
  }

  return {
    applySnapshot(s) {
      snapshot = s;
    },
    getSnapshot: () => snapshot,
    projectAt,
    driftStatus,
  };
}
