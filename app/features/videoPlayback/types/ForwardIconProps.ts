type ForwardIconProps = {
  videoRef: React.RefObject<HTMLVideoElement>;
  setCurrentTime: (time: number) => void;
  onManualAction?: (e) => void;
};

export default ForwardIconProps;
