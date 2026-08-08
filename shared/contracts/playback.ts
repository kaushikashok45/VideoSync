export type PlaybackStatus = "playing" | "paused" | "ended";

export interface PlaybackSnapshot {
  status: PlaybackStatus;
  currentTime: number;
  duration: number;
  rate: number;
  updatedAt: number;
}
