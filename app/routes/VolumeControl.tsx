import { SpeakerWaveIcon, SpeakerXMarkIcon } from "@heroicons/react/24/solid";
import { MutableRefObject, useEffect, useRef, useState } from "react";
import { closeAllOpenPopovers } from "~/utils/videoPlayerUtils";
import Popover from "./Popover";

type volumeControlProps = {
  videoRef: React.RefObject<HTMLVideoElement>;
};

function SpeakerWithSoundBar({ videoRef }: volumeControlProps) {
  const audioIconRef: React.RefObject<HTMLElement> = useRef(null);
  const volumeControlRef: React.RefObject<HTMLInputElement> = useRef(null);
  const [audioLevel, setAudioLevel] = useState(1);

  return (
    <div className="relative" ref={audioIconRef}>
      <button className="h-10 w-10 text-white text-sm rounded-full bg-red-600 p-2 flex items-center justify-center">
        <SpeakerWaveIcon></SpeakerWaveIcon>
      </button>
      <Popover
        triggerElementRef={audioIconRef}
        classList="-rotate-90 flex justify-center left-1/2 -translate-x-1/2 mb-[3.7em]"
      >
        <input
          ref={volumeControlRef}
          className="w-32 accent-red-600"
          type="range"
          min="0"
          max="1"
          step="0.01"
          value={audioLevel}
          onClick={(e) => {
            e.stopPropagation();
          }}
          onChange={(e) => {
            e.preventDefault();
            e.stopPropagation();
            const audioLevel = parseFloat(e.target.value);
            setAudioLevel(audioLevel);
            if (videoRef.current) {
              videoRef.current.volume = audioLevel;
            }
          }}
        />
      </Popover>
    </div>
  );
}

function VolumeMutedIcon() {
  return (
    <>
      <button className="h-10 w-10 text-white text-sm rounded-full bg-red-600 p-2 flex items-center justify-center">
        <SpeakerXMarkIcon></SpeakerXMarkIcon>
      </button>
    </>
  );
}

export default function VolumeControl({ videoRef }: volumeControlProps) {
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, []);

  function handleMuteToggle() {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  }

  function handleKeyPress(e) {
    if (e.key === "Enter") {
      e.preventDefault();
      handleMuteToggle();
    }
  }
  return (
    <div
      role="button"
      onClick={handleMuteToggle}
      tabIndex={0}
      onKeyPress={handleKeyPress}
    >
      {isMuted ? (
        <VolumeMutedIcon></VolumeMutedIcon>
      ) : (
        <SpeakerWithSoundBar videoRef={videoRef}></SpeakerWithSoundBar>
      )}
    </div>
  );
}
