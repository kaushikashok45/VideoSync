type VideoPlayerButtonComponentProps = {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  onKeyPress?: (e: React.KeyboardEvent) => void;
  allowSpacebarPress?: boolean;
};

export default VideoPlayerButtonComponentProps;
