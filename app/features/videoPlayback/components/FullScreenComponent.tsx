import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
} from "@heroicons/react/24/solid";
import { useState } from "react";
import ButtonComponent from "./VideoPlayerButtonComponent";
import FullScreenToggleProps from "../types/FullScreenToggleProps";

export default function FullScreenToggleComponent({
  videoWrapperRef,
}: FullScreenToggleProps) {
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
      <ButtonComponent onClick={handleScreenResize}>
        {isFullScreen ? (
          <ArrowsPointingInIcon className="size-6"></ArrowsPointingInIcon>
        ) : (
          <ArrowsPointingOutIcon className="size-6"></ArrowsPointingOutIcon>
        )}
      </ButtonComponent>
    </>
  );
}
