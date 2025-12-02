import {
  ArrowsPointingInIcon,
  ArrowsPointingOutIcon,
} from "@heroicons/react/24/solid";
import { useState } from "react";
import ButtonComponent from "./ButtonComponent";

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
      <ButtonComponent onClick={handleScreenResize}>
        {isFullScreen ? (
          <ArrowsPointingInIcon class="size-6"></ArrowsPointingInIcon>
        ) : (
          <ArrowsPointingOutIcon class="size-6"></ArrowsPointingOutIcon>
        )}
      </ButtonComponent>
    </>
  );
}
