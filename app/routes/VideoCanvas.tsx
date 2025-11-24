import { useEffect, useRef, Ref } from "react";
import { VideoPlayerControls } from "./VideoPlayerControls";

export type VideoMeta = {
  duration: number;
  currentTime: number;
};

type videoURLProps = {
  videoURL: string;
  videoMeta?: VideoMeta;
  shareLink?: string;
  stream?: MediaStream;
  getRef?: Ref<HTMLVideoElement>;
  onManualPause?: (e: any) => void;
  onManualResume?: (e: any) => void;
};

export function VideoPlayer({
  videoURL,
  stream,
  getRef,
  videoMeta,
  onManualPause,
  onManualResume,
}: videoURLProps) {
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
      className="video-player relative flex flex-col justify-center align-middle h-full w-fit max-h-full max-w-full"
      ref={videoWrapperRef}
    >
      <video
        ref={videoRef}
        src={videoURL}
        autoPlay
        controls={false}
        playsInline
        className="rounded-lg max-h-full max-w-full"
      ></video>
      <VideoPlayerControls
        videoRef={videoRef}
        videoMeta={videoMeta}
        videoWrapperRef={videoWrapperRef}
        onManualPause={onManualPause}
        onManualResume={onManualResume}
      ></VideoPlayerControls>
    </div>
  );
}

export default VideoPlayer;
