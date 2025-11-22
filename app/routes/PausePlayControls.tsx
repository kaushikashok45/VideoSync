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
    if (!videoRef.current || videoRef.current.paused) return;
    videoRef.current.pause();
    setIsPlaying(false);
  }

  function resumePlayback() {
    if (!videoRef.current || !videoRef.current.paused) return;
    videoRef.current.play();
    setIsPlaying(true);
  }

  function handlePlayPauseClick() {
    if (isPlaying) {
      pausePlayback();
      onManualPause && onManualPause();
    } else {
      resumePlayback();
      onManualResume && onManualResume();
    }
  }

  useEffect(() => {
    videoRef.current?.addEventListener("pause-playback", pausePlayback);
    videoRef.current?.addEventListener("resume-playback", resumePlayback);

    return () => {
      videoRef.current?.removeEventListener("pause-playback", pausePlayback);
      videoRef.current?.removeEventListener("resume-playback", resumePlayback);
    };
  }, []);

  return (
    <>
      <button
        className="h-10 w-10 text-white rounded-full bg-red-600 p-2"
        onClick={handlePlayPauseClick}
      >
        {isPlaying ? <PauseIcon></PauseIcon> : <PlayIcon></PlayIcon>}
      </button>
    </>
  );
}
