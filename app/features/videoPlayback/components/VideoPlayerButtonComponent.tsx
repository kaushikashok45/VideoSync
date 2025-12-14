import VideoPlayerButtonComponentProps from "../types/VideoPlayerButtonComponentProps";

export default function VideoPlayerButtonComponent({
  children,
  onClick,
  onKeyPress,
  allowSpacebarPress = false,
}: VideoPlayerButtonComponentProps) {
  function handleClick(e: React.MouseEvent) {
    onClick && onClick(e);
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (
      !allowSpacebarPress &&
      (e.key == " " || e.code == "Space" || e.keyCode == 32)
    ) {
      e.preventDefault();
      document.activeElement.blur();
    }
    onKeyPress && onKeyPress(e);
  }

  return (
    <>
      <button
        className="h-8 w-8 p-1 md:h-10 md:w-10 text-white rounded-full bg-black/40 backdrop-blur-md border border-white/10 rounded-full hover:bg-black/50 transition md:p-2 flex items-center justify-center"
        onClick={handleClick}
        onKeyDown={handleKeyPress}
      >
        {children}
      </button>
    </>
  );
}
