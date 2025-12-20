import { useEffect, useRef, useState } from "react";
import ForwardIcon from "./ForwardIcon";
import RewindIcon from "./RewindIcon";
import VolumeControl from "./VolumeControl";
import FullScreenToggleComponent from "./FullScreenComponent";
import PausePlayControls from "./PausePlayControls";
import ShareLink from "./ShareLink";
import VideoMeta from "../types/VideoMeta";
import ProgressSeeker from "./ProgressSeeker";

type VideoPlayerControlsProps = {
  videoRef: React.RefObject<HTMLVideoElement>;
  videoWrapperRef: React.RefObject<HTMLDivElement>;
  videoMeta?: VideoMeta;
  onManualPause?: (e: any) => void;
  onManualResume?: (e: any) => void;
  onManualForward?: (e: any) => void;
  onManualRewind?: (e: any) => void;
  onManualSeek?: (e: any) => void;
};

const formatTime = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const formattedHours = hours.toString().padStart(2, "0");
  const mins = Math.floor((seconds % 3600) / 60);
  const formattedMins = mins.toString().padStart(2, "0");
  const secs = Math.floor(seconds % 60);
  const formattedSecs = secs.toString().padStart(2, "0");
  return `${
    hours > 0 ? formattedHours + ":" : ""
  }${formattedMins}:${formattedSecs.toString().padStart(2, "0")}`;
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
  const [isControlsVisible, setIsControlsVisible] = useState(true);
  const controlsTimerId = useRef<NodeJS.Timeout | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const progressPercent = duration ? (currentTime / duration) * 100 : 0;

  function hideControls() {
    controlsTimerId.current = setTimeout(() => {
      setIsControlsVisible(false);
      controlsTimerId.current = null;
    }, 3000);
  }

  function showControls(e) {
    setIsControlsVisible(true);
  }

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (!videoRef.current || duration === 0) return;

    const bar = e.currentTarget;
    const rect = bar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percent = clickX / rect.width;
    const newTime = percent * duration;

    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  function toggleControlsVisibility(e) {
    if (isControlsVisible) {
      if (controlsTimerId.current) {
        clearTimeout(controlsTimerId.current);
      }
      hideControls();
    } else if (!isControlsVisible) {
      showControls(e);
    }
  }

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
    // hideControls();
    // videoRef.current?.addEventListener("mousemove", toggleControlsVisibility);
    // videoWrapperRef.current?.addEventListener(
    //   "mousemove",
    //   toggleControlsVisibility
    // );
    // videoRef.current?.addEventListener("mouseleave", hideControls);
    // return () => {
    //   if (controlsTimerId.current) {
    //     clearTimeout(controlsTimerId.current);
    //   }
    //   videoRef.current?.removeEventListener(
    //     "mousemove",
    //     toggleControlsVisibility
    //   );
    //   videoWrapperRef.current?.removeEventListener(
    //     "mousemove",
    //     toggleControlsVisibility
    //   );
    // };
    videoRef.current?.addEventListener("timeupdate", handleTimeUpdate);
    videoRef.current?.addEventListener("loadedmetadata", handleLoadedMetadata);
    return () => {
      videoRef.current?.removeEventListener("timeupdate", handleTimeUpdate);
      videoRef.current?.removeEventListener(
        "loadedmetadata",
        handleLoadedMetadata
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
      {/*<div id="progress-seeker-wrapper">
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
      </div>*/}
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
          ></PausePlayControls>
          <RewindIcon
            videoRef={videoRef}
            setCurrentTime={setCurrentTime}
            onManualAction={onManualRewind}
          ></RewindIcon>
          <ForwardIcon
            videoRef={videoRef}
            setCurrentTime={setCurrentTime}
            onManualAction={onManualForward}
          ></ForwardIcon>
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
          ></FullScreenToggleComponent>
        </div>
      </div>
    </div>
  );
}
