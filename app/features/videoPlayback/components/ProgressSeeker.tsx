import { useState, useEffect } from "react";
import ProgressSeekerProps from "../types/ProgressSeekerProps";

export default function ProgressBar({
  duration,
  progressPercent,
  videoRef,
  setCurrentTime,
  onManualSeek,
}: ProgressSeekerProps) {
  const [hoverPercent, setHoverPercent] = useState(0);

  useEffect(() => {
    videoRef.current?.addEventListener("seek-playback", seekPlayback);

    return () => {
      videoRef.current?.removeEventListener("seek-playback", seekPlayback);
    };
  }, []);

  const seekPlayback = (data) => {
    const time = isNaN(data) ? data.detail.time : data;
    if (!videoRef.current || !time) return;
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleProgressClick = (e) => {
    if (!videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    const newTime = percent * duration;
    onManualSeek && onManualSeek(newTime);
    seekPlayback(newTime);
  };

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const hoverPosition = ((e.clientX - rect.left) / rect.width) * 100;
    setHoverPercent(hoverPosition);
  };

  const handleMouseLeave = () => {
    setHoverPercent(0);
  };

  // Only show hover if it's ahead of current progress
  const showHoverPreview =
    hoverPercent !== null && hoverPercent > progressPercent;

  return (
    <div id="progress-seeker-wrapper">
      <div
        className="h-2 w-full bg-black/30 backdrop-blur-lg border-t border-white/10 focus:bg-black/30 rounded cursor-pointer relative"
        onClick={handleProgressClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        role="progressbar"
        tabIndex={0}
      >
        {/* Current progress (red) */}
        <div
          className="h-full bg-red-600 rounded absolute inset-0"
          style={{ width: `${progressPercent}%` }}
        ></div>

        {/* Hover preview (only beyond current progress) */}
        {showHoverPreview && (
          <div
            className="h-full bg-red-400/50 rounded absolute inset-0 pointer-events-none"
            style={{ width: `${hoverPercent}%` }}
          ></div>
        )}
      </div>
    </div>
  );
}
