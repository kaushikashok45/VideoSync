type PausePlayControlProps = {
  videoRef: React.RefObject<HTMLVideoElement>;
  onManualPause?: (e: React.SyntheticEvent) => void;
  onManualResume?: (e: React.SyntheticEvent) => void;
};

export default PausePlayControlProps;
