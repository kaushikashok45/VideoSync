import { useEffect, useState } from "react";
import ForwardIcon from "./ForwardIcon";
import RewindIcon from "./RewindIcon";
import VolumeControl from "./VolumeControl";
import FullScreenToggleComponent from "./FullScreenComponent";
import PausePlayControls from "./PausePlayControls";
import ShareLink from "./ShareLink";
import VideoMeta from "../types/VideoMeta";
import ProgressSeeker from "./ProgressSeeker";

type VideoPlayerControlsProps = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  videoWrapperRef: React.RefObject<HTMLDivElement | null>;
  videoMeta?: VideoMeta;
  onManualPause?: (e: unknown) => void;
  onManualResume?: (e: unknown) => void;
  onManualForward?: (e: unknown) => void;
  onManualRewind?: (e: unknown) => void;
  onManualSeek?: (time: number) => void;
};

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const formattedHours = hours.toString().padStart(2, "0");
  const mins = Math.floor((seconds % 3600) / 60);
  const formattedMins = mins.toString().padStart(2, "0");
  const secs = Math.floor(seconds % 60);
  const formattedSecs = secs.toString().padStart(2, "0");
  return `${hours > 0 ? formattedHours + ":" : ""}${formattedMins}:${
    formattedSecs.toString().padStart(2, "0")
  }`;
};

export function VideoPlayerControls({
  videoRef,
  videoWrapperRef,
  videoMeta,
  onManualPause,
  onManualResume,
  onManualForward,
  onManualRewind,
  onManualSeek,
}: VideoPlayerControlsProps) {
  const [isControlsVisible] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  function handleTimeUpdate() {
    if (videoMeta) {
      setCurrentTime(videoMeta.currentTime);
      return;
    }
    const currentTime = videoRef.current?.currentTime as number;
    setCurrentTime(currentTime);
  }

  function handleLoadedMetadata() {
    if (Number.isFinite(videoRef.current?.duration)) {
      const duration = videoRef.current ? videoRef.current.duration : 0;
      setDuration(duration);
    } else if (videoMeta) {
      setDuration(videoMeta.duration);
      setCurrentTime(videoMeta.currentTime);
    } else {
      setDuration(duration);
    }
  }

  useEffect(() => {
    videoRef.current?.addEventListener("timeupdate", handleTimeUpdate);
    videoRef.current?.addEventListener("loadedmetadata", handleLoadedMetadata);
    return () => {
      videoRef.current?.removeEventListener("timeupdate", handleTimeUpdate);
      videoRef.current?.removeEventListener(
        "loadedmetadata",
        handleLoadedMetadata,
      );
    };
  }, [videoMeta]);
  return (
    <div
      id="controls"
      className={`flex max-w-full relative w-full bottom-[4em] md:bottom-[6em] px-2 flex-col gap-4 md:gap-7 ${
        isControlsVisible ? "opacity-100" : "opacity-0"
      }`}
    >
      {
        /*<div id="progress-seeker-wrapper">
        <div
          className={`h-2 w-full bg-black/30 backdrop-blur-lg border-t border-white/10  rounded cursor-pointer relative`}
          onClick={handleProgressClick}
          role="progressbar"
          tabIndex={0}
        >
          <div
            className="h-full bg-red-600 rounded"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </div>*/
      }
      <ProgressSeeker
        duration={duration}
        progressPercent={progressPercent}
        videoRef={videoRef}
        setCurrentTime={setCurrentTime}
        onManualSeek={onManualSeek}
        key="progress-seeker"
      />
      <div
        id="playback-controls"
        className="flex w-full justify-between items-center"
      >
        <div id="left-controls-wrapper" className="flex gap-5">
          <PausePlayControls
            videoRef={videoRef}
            onManualPause={onManualPause}
            onManualResume={onManualResume}
          >
          </PausePlayControls>
          <RewindIcon
            videoRef={videoRef}
            setCurrentTime={setCurrentTime}
            onManualAction={onManualRewind}
          >
          </RewindIcon>
          <ForwardIcon
            videoRef={videoRef}
            setCurrentTime={setCurrentTime}
            onManualAction={onManualForward}
          >
          </ForwardIcon>
          <div className="self-center font-extrabold text-white text-[0.75rem] md:text-[1rem] bg-black/30 backdrop-blur-lg border-t border-white/10 rounded-lg p-2 md:p-2">
            <p>
              {formatTime(currentTime)} / {formatTime(duration)}
            </p>
          </div>
        </div>
        <div
          id="right-controls-wrapper"
          className="flex gap-5 justify-end items-center"
        >
          <ShareLink></ShareLink>
          <VolumeControl videoRef={videoRef}></VolumeControl>
          <FullScreenToggleComponent
            videoWrapperRef={videoWrapperRef}
          >
          </FullScreenToggleComponent>
        </div>
      </div>
    </div>
  );
}
