import VideoMeta from "./VideoMeta";
import { Ref } from "react";

type VideoPlayerProps = {
  videoURL: string;
  videoMeta?: VideoMeta;
  shareLink?: string;
  stream?: MediaStream;
  getRef?: Ref<HTMLVideoElement>;
  onManualPause?: (e: any) => void;
  onManualResume?: (e: any) => void;
};

export default VideoPlayerProps;
