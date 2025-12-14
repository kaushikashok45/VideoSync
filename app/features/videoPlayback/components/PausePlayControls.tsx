import { PauseIcon, PlayIcon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import ButtonComponent from "./VideoPlayerButtonComponent";
import PausePlayControlProps from "../types/PausePlayControlProps";

export default function PausePlayControls({
  videoRef,
  onManualPause,
  onManualResume,
}: PausePlayControlProps) {
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

  function handlePlayPauseClick(e: React.SyntheticEvent) {
    if (!videoRef.current?.paused) {
      pausePlayback();
      onManualPause && onManualPause(e);
    } else {
      resumePlayback();
      onManualResume && onManualResume(e);
    }
  }

  function handlePlayPausePress(e: KeyboardEvent) {
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
      <ButtonComponent onClick={handlePlayPauseClick} allowSpacebarPress={true}>
        {isPlaying ? (
          <PauseIcon className={"size-6"}></PauseIcon>
        ) : (
          <PlayIcon className={"size-6"}></PlayIcon>
        )}
      </ButtonComponent>
    </>
  );
}
