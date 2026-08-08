import { useEffect, useImperativeHandle } from "react";
import type { RefObject } from "react";
import type { PlaybackSnapshot } from "contracts/playback.ts";
import type { PlaybackStore } from "~/entities/playback/playback-store.ts";

export interface PlaybackSyncHandle {
  setVolume(volume: number): void;
  toggleFullscreen(): void;
}

export interface PlaybackSyncProps {
  store: PlaybackStore;
  videoRef: RefObject<HTMLVideoElement | null>;
  actionRef: RefObject<PlaybackSyncHandle | null>;
}

const DRIFT_SECONDS = 1.5;
const TIME_EPSILON = 0.3;

function applySnapshotToVideo(
  video: HTMLVideoElement,
  snapshot: PlaybackSnapshot,
): void {
  if (Math.abs(video.currentTime - snapshot.currentTime) > TIME_EPSILON) {
    video.currentTime = snapshot.currentTime;
  }
  video.playbackRate = snapshot.rate;
  if (snapshot.status === "playing" && video.paused) {
    video.play().catch(() => undefined);
  }
  if (snapshot.status === "paused" && !video.paused) {
    video.pause();
  }
}

function seedSnapshot(video: HTMLVideoElement, store: PlaybackStore): void {
  if (store.getState().getSnapshot()) return;
  store.getState().applyServerSnapshot({
    status: "paused",
    currentTime: video.currentTime,
    duration: Number.isFinite(video.duration) ? video.duration : 0,
    rate: 1,
    updatedAt: Date.now(),
  });
}

function correctDrift(
  video: HTMLVideoElement,
  projected: PlaybackSnapshot | undefined,
): void {
  if (!projected) return;
  if (Math.abs(video.currentTime - projected.currentTime) > DRIFT_SECONDS) {
    video.currentTime = projected.currentTime;
  }
}

export default function PlaybackSync({
  store,
  videoRef,
  actionRef,
}: PlaybackSyncProps) {
  const setVolume = (volume: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = Math.max(0, Math.min(1, volume));
  };
  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video?.requestFullscreen) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void video.requestFullscreen();
  };
  useImperativeHandle(actionRef, () => ({ setVolume, toggleFullscreen }), [
    videoRef,
  ]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const unsubscribe = store.subscribe(() => {
      const snapshot = store.getState().getSnapshot();
      if (snapshot) applySnapshotToVideo(video, snapshot);
    });
    const onLoaded = () => seedSnapshot(video, store);
    const onTime = () => {
      const projected = store.getState().projectedAt(Date.now());
      correctDrift(video, projected);
    };
    video.addEventListener("loadedmetadata", onLoaded);
    video.addEventListener("timeupdate", onTime);
    return () => {
      unsubscribe();
      video.removeEventListener("loadedmetadata", onLoaded);
      video.removeEventListener("timeupdate", onTime);
    };
  }, [store, videoRef]);

  return null;
}
