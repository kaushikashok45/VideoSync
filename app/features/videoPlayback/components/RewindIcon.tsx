import ForwardIconProps from "../types/ForwardIconProps";
import VideoPlayerButtonComponent from "./VideoPlayerButtonComponent";
import { useEffect } from "react";

export default function RewindIcon({
  videoRef,
  setCurrentTime,
  onManualAction,
}: ForwardIconProps) {
  useEffect(() => {
    videoRef.current?.addEventListener("rewind-playback", rewindPlayback);

    return () => {
      videoRef.current?.removeEventListener("rewind-playback", rewindPlayback);
    };
  }, []);

  function rewindPlayback() {
    if (!videoRef.current) return;
    const currentTime = videoRef.current.currentTime;
    const newTime = currentTime - 10;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }

  function handleRewindClick(event) {
    event.preventDefault();
    onManualAction && onManualAction(event);
    rewindPlayback();
  }

  return (
    <VideoPlayerButtonComponent onClick={handleRewindClick}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        strokeWidth={1.5}
        stroke="currentColor"
        className="size-6"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 15 3 9m0 0 6-6M3 9h12a6 6 0 0 1 0 12h-3"
        />
      </svg>
    </VideoPlayerButtonComponent>
  );
}
