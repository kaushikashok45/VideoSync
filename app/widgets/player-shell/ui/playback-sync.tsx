import { useEffect, useImperativeHandle, useRef } from "react";
import type { RefObject } from "react";
import type { PlaybackSnapshot } from "contracts/playback.ts";
import type { PlaybackStore } from "~/entities/playback/playback-store.ts";

export interface PlaybackSyncHandle {
  setVolume(volume: number): void;
  toggleFullscreen(): void;
  play(): Promise<boolean>;
}

export interface PlaybackSyncProps {
  mode: "host" | "receiver";
  store: PlaybackStore;
  videoRef: RefObject<HTMLVideoElement | null>;
  fullscreenRef?: RefObject<HTMLElement | null>;
  actionRef: RefObject<PlaybackSyncHandle | null>;
  stream?: MediaStream | null;
  autoplay?: boolean;
  onAutoplayBlocked?: () => void;
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
  if (!projected || projected.status !== "playing") return;
  if (Math.abs(video.currentTime - projected.currentTime) > DRIFT_SECONDS) {
    video.currentTime = projected.currentTime;
  }
}

export default function PlaybackSync({
  mode,
  store,
  videoRef,
  fullscreenRef,
  actionRef,
  stream = null,
  autoplay = false,
  onAutoplayBlocked,
}: PlaybackSyncProps) {
  const autoplayBlockedRef = useRef(onAutoplayBlocked);
  autoplayBlockedRef.current = onAutoplayBlocked;
  const setVolume = (volume: number) => {
    const video = videoRef.current;
    if (!video) return;
    const nextVolume = Math.max(0, Math.min(1, volume));
    video.volume = nextVolume;
    if (nextVolume > 0) video.muted = false;
  };
  const toggleFullscreen = () => {
    const target = fullscreenRef?.current ?? videoRef.current;
    if (!target?.requestFullscreen) return;
    if (document.fullscreenElement) void document.exitFullscreen();
    else void target.requestFullscreen();
  };
  const play = async () => {
    const video = videoRef.current;
    if (!video) return false;
    video.muted = false;
    try {
      await video.play();
      if (mode === "host") store.getState().play();
      return true;
    } catch {
      return false;
    }
  };
  useImperativeHandle(
    actionRef,
    () => ({ setVolume, toggleFullscreen, play }),
    [fullscreenRef, mode, store, videoRef],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const playStream = () => {
      if (!stream || !autoplay) return;
      video.muted = true;
      void video.play().catch(() => autoplayBlockedRef.current?.());
    };
    video.addEventListener("loadedmetadata", playStream);
    video.srcObject = stream;
    playStream();
    return () => {
      video.removeEventListener("loadedmetadata", playStream);
      if (video.srcObject === stream) video.srcObject = null;
    };
  }, [autoplay, stream, videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const unsubscribe = store.subscribe(() => {
      const snapshot = store.getState().getSnapshot();
      if (snapshot) applySnapshotToVideo(video, snapshot);
    });
    const onLoaded = () => {
      seedSnapshot(video, store);
      const snapshot = store.getState().getSnapshot();
      if (snapshot) applySnapshotToVideo(video, snapshot);
      if (!autoplay) return;
      void video.play()
        .then(() => {
          if (mode === "host") store.getState().play();
        })
        .catch(() => autoplayBlockedRef.current?.());
    };
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
  }, [autoplay, mode, store, videoRef]);

  return null;
}
