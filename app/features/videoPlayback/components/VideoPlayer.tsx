import { useEffect, useRef } from "react";
import { VideoPlayerControls } from "./VideoPlayerControls";
import VideoPlayerProps from "../types/VideoPlayerProps";

export function VideoPlayer({
  videoURL,
  stream,
  getRef,
  videoMeta,
  onManualPause,
  onManualResume,
  onManualForward,
  onManualRewind,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (getRef) {
      getRef.current = videoRef.current;
    }
    if (videoRef.current && stream) {
      // @ts-ignore
      videoRef.current.setSrcObject(stream);
    }
  }, []);
  return (
    <div
      className="video-player relative h-fit w-fit max-h-full max-w-full"
      ref={videoWrapperRef}
    >
      <video
        ref={videoRef}
        src={videoURL}
        autoPlay
        controls={false}
        playsInline
        className="rounded-lg h-full w-full max-h-full max-w-full"
      ></video>
      <VideoPlayerControls
        videoRef={videoRef}
        videoMeta={videoMeta}
        videoWrapperRef={videoWrapperRef}
        onManualPause={onManualPause}
        onManualResume={onManualResume}
        onManualForward={onManualForward}
        onManualRewind={onManualRewind}
      ></VideoPlayerControls>
    </div>
  );
}

export default VideoPlayer;
