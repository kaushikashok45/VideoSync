import { useEffect } from "react";
import ForwardIconProps from "../types/ForwardIconProps";
import VideoPlayerButtonComponent from "./VideoPlayerButtonComponent";

export default function ForwardIcon({
  videoRef,
  setCurrentTime,
  onManualAction,
}: ForwardIconProps) {
  useEffect(() => {
    videoRef.current?.addEventListener("forward-playback", forwardPlayback);

    return () => {
      videoRef.current?.removeEventListener(
        "forward-playback",
        forwardPlayback
      );
    };
  }, []);

  function forwardPlayback() {
    if (!videoRef.current) return;
    const currentTime = videoRef.current.currentTime;
    const newTime = currentTime + 10;
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  }

  function handleForwardClick(event) {
    event.preventDefault();
    onManualAction && onManualAction(event);
    if (!videoRef.current) return;
    forwardPlayback();
  }

  return (
    <VideoPlayerButtonComponent onClick={handleForwardClick}>
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
          d="m15 15 6-6m0 0-6-6m6 6H9a6 6 0 0 0 0 12h3"
        />
      </svg>
    </VideoPlayerButtonComponent>
  );
}
