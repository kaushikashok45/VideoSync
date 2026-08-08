import { PauseIcon, PlayIcon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import ButtonComponent from "./VideoPlayerButtonComponent";
import PausePlayControlProps from "../types/PausePlayControlProps";
import {
  pausedPlaybackMessage,
  resumedPlaybackMessage,
} from "~/features/toastMessages/logic/toastMessageLibrary";

export default function PausePlayControls({
  videoRef,
  onManualPause,
  onManualResume,
}: PausePlayControlProps) {
  const [isPlaying, setIsPlaying] = useState(true);

  function pausePlayback(e: unknown) {
    const initiator =
      e && (e as { detail: { userName: string } }).detail?.userName
        ? (e as { detail: { userName: string } }).detail.userName
        : "You";
    setIsPlaying(false);
    if (!videoRef.current || videoRef.current.paused) return;
    videoRef.current.pause();
    pausedPlaybackMessage(initiator);
  }

  function resumePlayback(e: unknown) {
    const initiator =
      e && (e as { detail: { userName: string } }).detail?.userName
        ? (e as { detail: { userName: string } }).detail.userName
        : "You";
    setIsPlaying(true);
    if (!videoRef.current || !videoRef.current.paused) return;
    videoRef.current.play();
    resumedPlaybackMessage(initiator);
  }

  function handlePlayPauseClick(e: React.SyntheticEvent | KeyboardEvent) {
    if (!videoRef.current?.paused) {
      pausePlayback(undefined);
      onManualPause && onManualPause(e as React.SyntheticEvent);
    } else {
      resumePlayback(undefined);
      onManualResume && onManualResume(e as React.SyntheticEvent);
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
      videoRef.current?.removeEventListener(
        "pause-playback",
        pausePlayback,
      );
      videoRef.current?.removeEventListener(
        "resume-playback",
        resumePlayback,
      );
      document.removeEventListener("keypress", handlePlayPausePress);
      navigator.mediaSession.setActionHandler("play", null);
      navigator.mediaSession.setActionHandler("pause", null);
    };
  }, []);

  return (
    <>
      <ButtonComponent
        onClick={handlePlayPauseClick}
        allowSpacebarPress
      >
        {isPlaying
          ? <PauseIcon className="size-6"></PauseIcon>
          : <PlayIcon className="size-6"></PlayIcon>}
      </ButtonComponent>
    </>
  );
}
