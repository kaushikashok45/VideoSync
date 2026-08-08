import type {
  PlaybackSnapshot,
  PlaybackStatus,
} from "../../../shared/contracts/playback.ts";

export interface PlaybackDeps {
  now: () => number;
  driftThresholdMs: number;
  seekStepSeconds: number;
}

export class PlaybackState {
  private snapshot: PlaybackSnapshot;

  constructor(private deps: PlaybackDeps, initial: PlaybackSnapshot) {
    this.snapshot = initial;
  }

  getSnapshot(): PlaybackSnapshot {
    return this.projected(this.deps.now());
  }

  play(): PlaybackSnapshot {
    if (this.snapshot.status === "ended") return this.getSnapshot();
    this.snapshot = {
      ...this.snapshot,
      status: "playing",
      updatedAt: this.deps.now(),
    };
    return this.getSnapshot();
  }

  pause(): PlaybackSnapshot {
    this.snapshot = {
      ...this.projected(this.deps.now()),
      status: "paused",
      updatedAt: this.deps.now(),
    };
    return this.getSnapshot();
  }

  seek(time: number): PlaybackSnapshot {
    const clamped = Math.max(0, Math.min(time, this.snapshot.duration || time));
    this.snapshot = {
      ...this.snapshot,
      currentTime: clamped,
      updatedAt: this.deps.now(),
    };
    return this.getSnapshot();
  }

  forward(step = this.deps.seekStepSeconds): PlaybackSnapshot {
    return this.seek(this.projected(this.deps.now()).currentTime + step);
  }

  rewind(step = this.deps.seekStepSeconds): PlaybackSnapshot {
    return this.seek(this.projected(this.deps.now()).currentTime - step);
  }

  setDuration(duration: number): PlaybackSnapshot {
    this.snapshot = { ...this.snapshot, duration };
    return this.getSnapshot();
  }

  projected(now: number): PlaybackSnapshot {
    if (this.snapshot.status !== "playing") return this.snapshot;
    const elapsedSec = Math.max(0, (now - this.snapshot.updatedAt) / 1000) *
      this.snapshot.rate;
    const duration = this.snapshot.duration || Number.POSITIVE_INFINITY;
    const currentTime = Math.min(
      this.snapshot.currentTime + elapsedSec,
      duration,
    );
    return { ...this.snapshot, currentTime };
  }

  driftMs(viewerPositionMs: number, now: number): number {
    return viewerPositionMs - this.projected(now).currentTime * 1000;
  }

  isDriftAcceptable(driftMs: number): boolean {
    return Math.abs(driftMs) <= this.deps.driftThresholdMs;
  }

  get status(): PlaybackStatus {
    return this.snapshot.status;
  }
}
