import { createStore, type StoreApi } from "zustand/vanilla";
import type { PlaybackSnapshot } from "contracts/playback.ts";
import { createSyncEngineClient } from "../../shared/api/sync-engine-client.ts";

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

const SEEK_STEP_SECONDS = 10;

export type PlaybackStore = StoreApi<PlaybackState>;

export function createPlaybackStore(deps: PlaybackStoreDeps): PlaybackStore {
  const engine = createSyncEngineClient(deps);
  return createStore<PlaybackState>()((set) => {
    function sync(): PlaybackSnapshot | undefined {
      const snap = engine.getSnapshot();
      set({ snapshot: snap });
      return snap;
    }
    function commit(s: PlaybackSnapshot): PlaybackSnapshot | undefined {
      engine.applySnapshot(s);
      return sync();
    }
    function play(): PlaybackSnapshot | undefined {
      const current = engine.getSnapshot();
      if (!current) return undefined;
      if (current.status === "ended" || current.status === "playing") {
        return engine.projectAt(Date.now());
      }
      return commit({
        ...current,
        status: "playing",
        updatedAt: Date.now(),
      });
    }
    function pause(): PlaybackSnapshot | undefined {
      const current = engine.getSnapshot();
      if (!current) return undefined;
      const projected = engine.projectAt(Date.now()) ?? current;
      return commit({
        ...projected,
        status: "paused",
        updatedAt: Date.now(),
      });
    }
    function seek(t: number): PlaybackSnapshot | undefined {
      const current = engine.getSnapshot();
      if (!current) return undefined;
      const clamped = Math.max(0, Math.min(t, current.duration || t));
      return commit({
        ...current,
        currentTime: clamped,
        updatedAt: Date.now(),
      });
    }
    function forward(): PlaybackSnapshot | undefined {
      const current = engine.getSnapshot();
      if (!current) return undefined;
      const position = engine.projectAt(Date.now())?.currentTime ?? 0;
      return seek(position + SEEK_STEP_SECONDS);
    }
    function rewind(): PlaybackSnapshot | undefined {
      const current = engine.getSnapshot();
      if (!current) return undefined;
      const position = engine.projectAt(Date.now())?.currentTime ?? 0;
      return seek(position - SEEK_STEP_SECONDS);
    }
    return {
      snapshot: undefined,
      applyServerSnapshot(s) {
        engine.applySnapshot(s);
        sync();
      },
      getSnapshot: () => engine.getSnapshot(),
      projectedAt: (now) => engine.projectAt(now),
      play,
      pause,
      seek,
      forward,
      rewind,
      driftStatus: (viewerPositionMs, now) =>
        engine.driftStatus(viewerPositionMs, now),
    };
  });
}
