import { createStore, type StoreApi } from "zustand/vanilla";
import type { PlaybackSnapshot } from "contracts/playback.ts";
import {
  createSyncEngineClient,
  type SyncEngineClient,
} from "../../shared/api/sync-engine-client.ts";
import { SMALL_SEEK_SECONDS } from "./seek-seconds.ts";

export interface PlaybackStoreDeps {
  driftThresholdMs: number;
}

export interface PlaybackState {
  snapshot: PlaybackSnapshot | undefined;
  applyServerSnapshot(s: PlaybackSnapshot): void;
  getSnapshot(): PlaybackSnapshot | undefined;
  projectedAt(now: number): PlaybackSnapshot | undefined;
  play(): PlaybackSnapshot | undefined;
  pause(): PlaybackSnapshot | undefined;
  seek(t: number): PlaybackSnapshot | undefined;
  forward(): PlaybackSnapshot | undefined;
  rewind(): PlaybackSnapshot | undefined;
  driftStatus(
    viewerPositionMs: number,
    now: number,
  ): "in-sync" | "behind" | "ahead";
}

export type PlaybackStore = StoreApi<PlaybackState>;

type SetFn = PlaybackStore["setState"];

function syncAction(
  set: SetFn,
  engine: SyncEngineClient,
): PlaybackSnapshot | undefined {
  const snap = engine.getSnapshot();
  set({ snapshot: snap });
  return snap;
}

function commitAction(
  set: SetFn,
  engine: SyncEngineClient,
  s: PlaybackSnapshot,
): PlaybackSnapshot | undefined {
  engine.applySnapshot(s);
  return syncAction(set, engine);
}

function applyServerSnapshotAction(
  set: SetFn,
  engine: SyncEngineClient,
  s: PlaybackSnapshot,
): void {
  engine.applySnapshot(s);
  syncAction(set, engine);
}

function playAction(
  set: SetFn,
  engine: SyncEngineClient,
): PlaybackSnapshot | undefined {
  const current = engine.getSnapshot();
  if (!current) return undefined;
  if (current.status === "ended" || current.status === "playing") {
    return engine.projectAt(Date.now());
  }
  return commitAction(set, engine, {
    ...current,
    status: "playing",
    updatedAt: Date.now(),
  });
}

function pauseAction(
  set: SetFn,
  engine: SyncEngineClient,
): PlaybackSnapshot | undefined {
  const current = engine.getSnapshot();
  if (!current) return undefined;
  const projected = engine.projectAt(Date.now()) ?? current;
  return commitAction(set, engine, {
    ...projected,
    status: "paused",
    updatedAt: Date.now(),
  });
}

function seekAction(
  set: SetFn,
  engine: SyncEngineClient,
  t: number,
): PlaybackSnapshot | undefined {
  const current = engine.getSnapshot();
  if (!current) return undefined;
  const clamped = Math.max(0, Math.min(t, current.duration || t));
  return commitAction(set, engine, {
    ...current,
    currentTime: clamped,
    updatedAt: Date.now(),
  });
}

function forwardAction(
  set: SetFn,
  engine: SyncEngineClient,
): PlaybackSnapshot | undefined {
  const current = engine.getSnapshot();
  if (!current) return undefined;
  const position = engine.projectAt(Date.now())?.currentTime ?? 0;
  return seekAction(set, engine, position + SMALL_SEEK_SECONDS);
}

function rewindAction(
  set: SetFn,
  engine: SyncEngineClient,
): PlaybackSnapshot | undefined {
  const current = engine.getSnapshot();
  if (!current) return undefined;
  const position = engine.projectAt(Date.now())?.currentTime ?? 0;
  return seekAction(set, engine, position - SMALL_SEEK_SECONDS);
}

export function createPlaybackStore(deps: PlaybackStoreDeps): PlaybackStore {
  const engine = createSyncEngineClient(deps);
  return createStore<PlaybackState>()((set) => ({
    snapshot: undefined,
    applyServerSnapshot: (s) => applyServerSnapshotAction(set, engine, s),
    getSnapshot: () => engine.getSnapshot(),
    projectedAt: (now) => engine.projectAt(now),
    play: () => playAction(set, engine),
    pause: () => pauseAction(set, engine),
    seek: (t) => seekAction(set, engine, t),
    forward: () => forwardAction(set, engine),
    rewind: () => rewindAction(set, engine),
    driftStatus: (viewerPositionMs, now) =>
      engine.driftStatus(viewerPositionMs, now),
  }));
}
