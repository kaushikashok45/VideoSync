import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
} from "@heroicons/react/24/solid";
import { useState } from "react";

type fullScreenToggleProps = {
  videoWrapperRef: React.RefObject<HTMLDivElement>;
};

export default function FullScreenToggleComponent({
  videoWrapperRef,
}: fullScreenToggleProps) {
  const [isFullScreen, setIsFullScreen] = useState(false);

  function handleScreenResize() {
    if (isFullScreen) {
      document.exitFullscreen();
    } else {
      videoWrapperRef.current?.requestFullscreen();
    }
    setIsFullScreen(!isFullScreen);
  }

  return (
    <>
      <button
        className="h-5 w-5 p-1 md:h-10 md:w-10 text-white text-sm rounded-full bg-red-600 md:p-2 flex items-center justify-center"
        onClick={handleScreenResize}
      >
        {isFullScreen ? (
          <ArrowsPointingInIcon></ArrowsPointingInIcon>
        ) : (
          <ArrowsPointingOutIcon></ArrowsPointingOutIcon>
        )}
      </button>
    </>
  );
}
