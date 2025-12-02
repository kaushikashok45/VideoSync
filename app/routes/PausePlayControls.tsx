import { PauseIcon, PlayIcon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";

type pausePlayControlsProps = {
  videoRef: React.RefObject<HTMLVideoElement>;
  onManualPause?: (e: any) => void;
  onManualResume?: (e: any) => void;
};

export default function PausePlayControls({
  videoRef,
  onManualPause,
  onManualResume,
}: pausePlayControlsProps) {
  const [isPlaying, setIsPlaying] = useState(true);

  function pausePlayback() {
    setIsPlaying(false);
    if (!videoRef.current || videoRef.current.paused) return;
    videoRef.current.pause();
  }

  function resumePlayback() {
    setIsPlaying(true);
    if (!videoRef.current || !videoRef.current.paused) return;
    videoRef.current.play();
  }

  function handlePlayPauseClick(e) {
    if (!videoRef.current?.paused) {
      pausePlayback();
      onManualPause && onManualPause(e);
    } else {
      resumePlayback();
      onManualResume && onManualResume(e);
    }
  }

  function handlePlayPausePress(e) {
    if (
      e.key == " " ||
      e.code == "Space" ||
      e.keyCode == 32 ||
      e.key === "MediaPlayPause"
    ) {
      e.preventDefault();
      e.stopPropagation();
      handlePlayPauseClick(e);
    }
  }

  useEffect(() => {
    videoRef.current?.addEventListener("pause-playback", pausePlayback);
    videoRef.current?.addEventListener("resume-playback", resumePlayback);
    document.addEventListener("keypress", handlePlayPausePress);
    navigator.mediaSession.setActionHandler("play", () => {});
    navigator.mediaSession.setActionHandler("pause", () => {});

    return () => {
      videoRef.current?.removeEventListener("pause-playback", pausePlayback);
      videoRef.current?.removeEventListener("resume-playback", resumePlayback);
      document.removeEventListener("keypress", handlePlayPausePress);
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
    };
  }, []);

  return (
    <>
      <button
        className="h-5 w-5 p-1 md:h-10 md:w-10 text-white rounded-full bg-red-600 md:p-2"
        onClick={handlePlayPauseClick}
      >
        {isPlaying ? <PauseIcon></PauseIcon> : <PlayIcon></PlayIcon>}
      </button>
    </>
  );
}
