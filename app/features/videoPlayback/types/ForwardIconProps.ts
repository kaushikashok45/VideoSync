type ForwardIconProps = {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  setCurrentTime: (time: number) => void;
  onManualAction?: (e: React.MouseEvent) => void;
};

export default ForwardIconProps;
