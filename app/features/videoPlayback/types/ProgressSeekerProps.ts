type ProgressSeekerProps = {
  duration: number;
  progressPercent: number;
  videoRef: React.RefObject<HTMLVideoElement>;
  setCurrentTime: (time: number) => void;
  onManualSeek?: (time: number) => void;
};

export default ProgressSeekerProps;
