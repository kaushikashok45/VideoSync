import VideoMeta from "./VideoMeta";
import { Ref } from "react";

type VideoPlayerProps = {
  videoURL: string;
  videoMeta?: VideoMeta;
  shareLink?: string;
  stream?: MediaStream;
  getRef?: Ref<HTMLVideoElement>;
  onManualPause?: (e: unknown) => void;
  onManualResume?: (e: unknown) => void;
  onManualForward?: (e: unknown) => void;
  onManualRewind?: (e: unknown) => void;
  onManualSeek?: (time: number) => void;
};

export default VideoPlayerProps;
