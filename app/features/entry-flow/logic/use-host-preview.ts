import { useEffect, useRef, useState } from "react";
import type { SyntheticEvent } from "react";

async function play(video: HTMLVideoElement): Promise<boolean> {
  try {
    await video.play();
    return true;
  } catch {
    return false;
  }
}

export function useHostPreview(src: string | null) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    setDurationSeconds(null);
    if (!src || !videoRef.current) return;
    void play(videoRef.current).then((started) => {
      setAutoplayBlocked(!started);
      setIsPlaying(started);
    });
  }, [src]);

  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (!video.paused) {
      video.pause();
      setAutoplayBlocked(false);
      setIsPlaying(false);
      return;
    }
    const started = await play(video);
    setAutoplayBlocked(!started);
    setIsPlaying(started);
  };

  const syncDuration = (event: SyntheticEvent<HTMLVideoElement>) => {
    const duration = event.currentTarget.duration;
    setDurationSeconds(Number.isFinite(duration) ? duration : null);
  };

  return {
    videoRef,
    durationSeconds,
    autoplayBlocked,
    isPlaying,
    togglePlayback,
    syncDuration,
  };
}
