import { useState } from "react";
import ButtonComponent from "./VideoPlayerButtonComponent";
import FullScreenToggleProps from "../types/FullScreenToggleProps";
import { Maximize2, Minimize2 } from "lucide-react";

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
        {isFullScreen
          ? <Minimize2 className="size-6" />
          : <Maximize2 className="size-6" />}
      </ButtonComponent>
    </>
  );
}
