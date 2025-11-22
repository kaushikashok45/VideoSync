/* eslint-disable jsx-a11y/media-has-caption */
import {
  PlayIcon,
  PauseIcon,
  ForwardIcon,
  BackwardIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon,
  SpeakerWaveIcon,
  SpeakerXMarkIcon,
  ShareIcon,
} from "@heroicons/react/24/solid";
import {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
  MutableRefObject,
  EventHandler,
  Ref,
} from "react";
import {
  peerVideoMeta,
  videoPlaybackControlMeta,
} from "~/utils/peerSignalContract";
import {
  pausedPlaybackMessage,
  resumedPlaybackMessage,
} from "~/toastMessages/toastMessageLibrary";
import { VideoPlayerControls } from "./VideoPlayerControls";

export type VideoMeta = {
  duration: number;
  currentTime: number;
};

type videoURLProps = {
  videoURL: string;
  videoMeta?: VideoMeta;
  shareLink?: string;
  stream?: MediaStream;
  getRef?: Ref<HTMLVideoElement>;
  onManualPause?: (e: any) => void;
  onManualResume?: (e: any) => void;
};

// const VideoPlayer = forwardRef(
//   ({ videoURL, shareLink }: videoURLProps, ref) => {
//     const videoRef = useRef<HTMLVideoElement | null>(null);
//     const mediaStreamRef = useRef<MediaStream | null>(null);
//     const [isPlaying, setIsPlaying] = useState(false);
//     const [canShowControls, setCanShowControls] = useState(true);
//     const [currentTime, setCurrentTime] = useState(0);
//     const [duration, setDuration] = useState(0);
//     const [isFullScreen, setIsFullScreen] = useState(false);
//     const [isMuted, setIsMuted] = useState(false);
//     const [canShowAudioSlider, setCanShowAudioSlider] = useState(false);
//     const [audioLevel, setAudioLevel] = useState(1);
//     const elapsedTime = useRef<number>(0);
//     const pauseDelay = useRef<number>(0);
//     const audioIconRef = useRef<HTMLDivElement | null>(null);
//     const HIDE_CONTROLS_TIMEOUT = 3000;
//     const executeScroll = () => {
//       if (!videoRef.current) {
//         return;
//       }
//       videoRef.current.scrollIntoView();
//     };
//     const handlePlay = () => {
//       if (!videoRef.current) return;
//       if (isPlaying) {
//         videoRef.current.pause();
//         pauseStream();
//         setIsPlaying(false);
//       } else {
//         videoRef.current.play();
//         resumeStream();
//         setIsPlaying(true);
//       }
//     };
//     const handleMouseEnter = () => {
//       showPlaybackControls();
//     };
//     const handleMouseLeave = () => {
//       if (isPlaying) {
//         hidePlaybackControls();
//       }
//     };

//     const showPlaybackControls = () => {
//       setCanShowControls(true);
//     };

//     const hidePlaybackControls = () => {
//       setTimeout(() => {
//         setCanShowControls(false);
//       }, HIDE_CONTROLS_TIMEOUT);
//     };

//     const showAndHidePlaybackControls = () => {
//       showPlaybackControls();
//       if (isPlaying) {
//         hidePlaybackControls();
//       }
//     };

//     const handleMouseMove = () => {
//       if (isFullScreen) {
//         showAndHidePlaybackControls();
//       }
//     };

//     const pauseStream = () => {
//       if (!videoRef.current || videoRef.current.srcObject === null) return;
//       const mediaStream = videoRef.current?.srcObject as MediaStream;
//       mediaStream.getVideoTracks().forEach((track) => (track.enabled = false));
//       mediaStream.getAudioTracks().forEach((track) => (track.enabled = false));
//     };

//     const resumeStream = () => {
//       if (!videoRef.current || videoRef.current.srcObject === null) return;
//       const mediaStream = videoRef.current.srcObject as MediaStream;
//       mediaStream.getVideoTracks().forEach((track) => (track.enabled = true));
//       mediaStream.getAudioTracks().forEach((track) => (track.enabled = true));
//     };

//     const toggleMutedState = (event: React.MouseEvent<HTMLButtonElement>) => {
//       event.stopPropagation();
//       if (videoRef.current) {
//         videoRef.current.muted = !isMuted;
//       }
//       setIsMuted(!isMuted);
//     };

//     const setVolumeLevel = (e: React.ChangeEvent<HTMLInputElement>) => {
//       e.preventDefault();
//       e.stopPropagation();
//       const audioLevel = parseFloat(e.target.value);
//       setAudioLevel(audioLevel);
//       if (videoRef.current) {
//         videoRef.current.volume = audioLevel;
//         if (audioLevel === 0) {
//           setIsMuted(true);
//         }
//       }
//     };

//     useImperativeHandle(ref, () => ({
//       setVideoMeta: (videoMeta: peerVideoMeta) => {
//         elapsedTime.current = videoMeta.currentTime + 0.5;
//         pauseDelay.current = videoRef.current
//           ? videoRef.current?.currentTime - (videoMeta.currentTime + 0.5)
//           : 0;
//         setDuration(videoMeta.duration);
//       },
//       play() {
//         videoRef.current?.play();
//       },
//       pause() {
//         videoRef.current?.pause();
//       },
//       pauseRemoteStream() {
//         pauseStream();
//       },
//       resumeRemoteStream() {
//         resumeStream();
//       },
//       addEventListener(
//         eventName: string,
//         script: EventListenerOrEventListenerObject
//       ) {
//         videoRef.current?.addEventListener(eventName, script);
//       },
//       removeEventListener(
//         eventName: string,
//         script: EventListenerOrEventListenerObject
//       ) {
//         videoRef.current?.removeEventListener(eventName, script);
//       },
//       captureStream(): MediaStream {
//         // @ts-ignore
//         return videoRef.current?.captureStream();
//         //TODO: need to support polyfill for non-Chromium browsers
//       },
//       setSrcObject(mediaStream: MediaStream) {
//         if (videoRef.current) {
//           videoRef.current.srcObject = mediaStream;
//         }
//       },
//       isPaused(): boolean {
//         let isPaused = videoRef.current?.paused;
//         if (isPaused === null || isPaused === undefined) {
//           isPaused = false;
//         }
//         return isPaused;
//       },
//       isPlaying(): boolean {
//         return !this.isPaused();
//       },
//       getDuration(): number {
//         let duration = 0;
//         if (videoRef.current && Number.isFinite(videoRef.current.duration)) {
//           duration = videoRef.current.duration;
//         }
//         return duration;
//       },
//       getCurrentTime(): number {
//         let currentTime = 0;
//         if (videoRef.current && Number.isFinite(videoRef.current.currentTime)) {
//           currentTime = videoRef.current.currentTime;
//         }
//         return currentTime;
//       },
//       triggerEvent(eventName: string, payload: videoPlaybackControlMeta) {
//         if (videoRef.current === null) {
//           return;
//         }
//         const customEvent = new CustomEvent<videoPlaybackControlMeta>(
//           eventName,
//           {
//             detail: payload,
//           }
//         );
//         videoRef.current.dispatchEvent(customEvent);
//       },
//       getHTMLElement(): HTMLVideoElement {
//         let videoElement: HTMLVideoElement;
//         if (videoRef.current === null) {
//           videoElement = document.createElement("video");
//         } else {
//           videoElement = videoRef.current;
//         }
//         return videoElement;
//       },
//     }));

//     useEffect(() => {
//       console.log("Video Player is mounted");
//       function handleFullscreenChange() {
//         setIsFullScreen(Boolean(document.fullscreenElement));
//         if (isFullScreen) {
//           showAndHidePlaybackControls();
//         }
//       }

//       function handleSpacebarPress(event: KeyboardEvent) {
//         console.log(event);
//         if ((event.key === " " || event.code === "Space") && isFullScreen) {
//           console.log("yay");
//           event.preventDefault();
//           handlePlay();
//         }
//       }

//       function showAudioSlider() {
//         setCanShowAudioSlider(true);
//       }

//       function hideAudioSlider() {
//         setCanShowAudioSlider(false);
//       }

//       function pauseVideo(event: CustomEvent<videoPlaybackControlMeta>) {
//         videoRef.current?.pause();
//         console.log(event);
//         const { userName } = event.detail;
//         pausedPlaybackMessage(userName);
//       }

//       function playVideo(event: CustomEvent<videoPlaybackControlMeta>) {
//         videoRef.current?.play();
//         const { userName } = event.detail;
//         resumedPlaybackMessage(userName);
//       }

//       document.addEventListener("fullscreenchange", handleFullscreenChange);
//       document.addEventListener("keypress", handleSpacebarPress);
//       videoRef.current?.addEventListener("pause", pauseStream);
//       videoRef.current?.addEventListener("play", resumeStream);
//       videoRef.current?.addEventListener(
//         "pause-video",
//         pauseVideo as EventHandler<any>
//       );
//       videoRef.current?.addEventListener(
//         "play-video",
//         playVideo as EventHandler<any>
//       );
//       audioIconRef.current?.addEventListener("mouseover", showAudioSlider);
//       audioIconRef.current?.addEventListener("mouseout", hideAudioSlider);
//       // Cleanup function to remove the event listener
//       return () => {
//         document.removeEventListener(
//           "fullscreenchange",
//           handleFullscreenChange
//         );
//         document.removeEventListener("keypress", handleSpacebarPress);
//         videoRef.current?.removeEventListener("pause", pauseStream);
//         videoRef.current?.removeEventListener("play", resumeStream);
//         videoRef.current?.removeEventListener(
//           "pause-video",
//           pauseVideo as EventHandler<any>
//         );
//         videoRef.current?.removeEventListener(
//           "play-video",
//           playVideo as EventHandler<any>
//         );
//         audioIconRef.current?.removeEventListener("mouseover", showAudioSlider);
//         audioIconRef.current?.removeEventListener("mouseout", hideAudioSlider);
//       };
//     }, []);

//     const formatTime = (seconds: number): string => {
//       const mins = Math.floor(seconds / 60);
//       const secs = Math.floor(seconds % 60);
//       return `${mins}:${secs.toString().padStart(2, "0")}`;
//     };

//     useEffect(() => {
//       const video = videoRef.current;

//       if (!video || mediaStreamRef.current) {
//         console.log("useEffect aborted");
//         return;
//       }
//       console.log("Video canvas update triggered ", duration);
//       const handleTimeUpdate = () => {
//         const currentTime = video.currentTime - pauseDelay.current;
//         setCurrentTime(currentTime);
//       };
//       const handleLoadedMetadata = () => {
//         if (Number.isFinite(video.duration)) {
//           setDuration(video.duration);
//         } else {
//           setDuration(duration);
//         }
//       };

//       video.addEventListener("timeupdate", handleTimeUpdate);
//       video.addEventListener("loadedmetadata", handleLoadedMetadata);

//       return () => {
//         video.removeEventListener("timeupdate", handleTimeUpdate);
//         video.removeEventListener("loadedmetadata", handleLoadedMetadata);
//       };
//     }, []);

//     const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
//       e.stopPropagation();
//       if (!videoRef.current || duration === 0) return;

//       const bar = e.currentTarget;
//       const rect = bar.getBoundingClientRect();
//       const clickX = e.clientX - rect.left;
//       const percent = clickX / rect.width;
//       const newTime = percent * duration;

//       videoRef.current.currentTime = newTime;
//       setCurrentTime(newTime);
//     };

//     const playVideoInFullScreen = (
//       event: React.MouseEvent<HTMLButtonElement>
//     ) => {
//       event.stopPropagation();
//       const video = document.getElementById("videoContainer");
//       if (!video) return;
//       if (video.requestFullscreen) {
//         video.requestFullscreen();
//       }
//     };

//     const exitVideoFromFullScreen = (
//       event: React.MouseEvent<HTMLButtonElement>
//     ) => {
//       event.stopPropagation();
//       if (isFullScreen) {
//         document.exitFullscreen();
//         setIsFullScreen(false);
//         executeScroll();
//       }
//     };

//     const preventClickEventPropagation = (
//       event: React.MouseEvent<HTMLDivElement>
//     ) => {
//       event.stopPropagation();
//     };

//     const progressPercent = duration ? (currentTime / duration) * 100 : 0;
//     const combinedRef = (node: HTMLVideoElement) => {
//       videoRef.current = node;
//       if (ref) {
//         // @ts-ignore
//         ref.current = node;
//       }
//     };
//     return (
//       <div
//         id="videoContainer"
//         className="relative w-[70%] max-w-[800px]"
//         onMouseEnter={handleMouseEnter}
//         onBlur={handleMouseLeave}
//         onMouseLeave={handleMouseLeave}
//         onClick={handlePlay}
//         onMouseMove={handleMouseMove}
//       >
//         <video
//           className={`videoPlayer w-full block rounded-lg ${
//             isFullScreen ? "h-full" : ""
//           }`}
//           src={videoURL}
//           ref={combinedRef}
//           controls={false}
//           autoPlay
//           playsInline
//         ></video>
//         <div
//           className={`controls w-full absolute ${
//             isFullScreen ? "bottom-4 py-4" : "bottom-0 py-4"
//           } left-1/2 transform -translate-x-1/2 flex-col items-center bg-black/20 backdrop-blur-md backdrop-saturate-150 border border-white/20 px-4 rounded-lg transition-opacity duration-300 ease-in-out ${
//             canShowControls ? "opacity-100" : "opacity-0 pointer-events-none"
//           }`}
//         >
//           <div className={`progress-seeker ${isFullScreen ? "mb-10" : ""}`}>
//             <div
//               className={`h-2 w-full bg-gray-100 rounded cursor-pointer relative`}
//               onClick={handleProgressClick}
//             >
//               <div
//                 className="h-full bg-red-600 rounded"
//                 style={{ width: `${progressPercent}%` }}
//               />
//             </div>
//             <span className={`text-white text-sm flex flex-row relative`}>
//               <span className={`mr-auto`}>{formatTime(currentTime)}</span>
//               <span className={`ml-auto`}>{formatTime(duration)}</span>
//             </span>
//           </div>
//           <div
//             className={`playbackControls absolute left-1/2 bottom-0 transform -translate-x-1/2  flex flex-row gap-5 ${
//               isFullScreen ? "mb-10" : "py-1"
//             }`}
//             onClick={preventClickEventPropagation}
//           >
//             <button className="controlButton">
//               <BackwardIcon className="h-8 w-8 text-white" />
//             </button>
//             {videoRef.current && !videoRef.current.paused ? (
//               <button className="controlButton" onClick={handlePlay}>
//                 <PauseIcon className="h-8 w-8 text-white" />
//               </button>
//             ) : (
//               <button className="controlButton" onClick={handlePlay}>
//                 <PlayIcon className="h-8 w-8 text-white" />
//               </button>
//             )}
//             <button className="controlButton">
//               <ForwardIcon className="h-8 w-8 text-white" />
//             </button>
//           </div>
//         </div>
//         <div
//           className={`playbackControls p-1.5 absolute bg-black/20 backdrop-blur-md backdrop-saturate-150 border border-white/20 px-4 rounded-lg transition-opacity duration-300 ease-in-out ${
//             isFullScreen ? "top-10 right-10" : "top-5 right-5"
//           } ${
//             canShowControls ? "opacity-100" : "opacity-0 pointer-events-none"
//           }`}
//         >
//           {!isFullScreen ? (
//             <button
//               className="controlButton mr-auto"
//               onClick={playVideoInFullScreen}
//             >
//               <ArrowsPointingOutIcon className="h-5 w-6 text-white" />
//             </button>
//           ) : (
//             <button
//               className="controlButton mr-auto"
//               onClick={exitVideoFromFullScreen}
//             >
//               <ArrowsPointingInIcon className="h-5 w-6 text-white" />
//             </button>
//           )}
//         </div>
//         <div
//           className={`playbackControls p-1.5 absolute bg-black/20 backdrop-blur-md backdrop-saturate-150 border border-white/20 px-4 rounded-lg transition-opacity duration-300 ease-in-out ${
//             isFullScreen ? "top-10 left-10" : "top-5 left-5"
//           } ${
//             canShowControls ? "opacity-100" : "opacity-0 pointer-events-none"
//           }`}
//         >
//           {isMuted ? (
//             <button
//               className="controlButton mr-auto"
//               onClick={toggleMutedState}
//             >
//               <SpeakerXMarkIcon className="h-6 w-6 text-white" />
//             </button>
//           ) : (
//             <div ref={audioIconRef} className={`flex flex-row gap-2`}>
//               <button
//                 className="controlButton mr-auto"
//                 onClick={toggleMutedState}
//               >
//                 <SpeakerWaveIcon className="h-6 w-6 text-white" />
//               </button>
//               <input
//                 type="range"
//                 min="0"
//                 max="1"
//                 step="0.01"
//                 value={audioLevel}
//                 className={`volume-slider accent-red-600 transition-all duration-500 overflow-hidden cursor-pointer ${
//                   canShowAudioSlider
//                     ? "opacity-100"
//                     : "opacity-0 pointer-events-none h-0 w-0"
//                 }`}
//                 id="volumeSlider"
//                 onClick={(e) => e.stopPropagation()}
//                 onChange={setVolumeLevel}
//               ></input>
//             </div>
//           )}
//           {shareLink ? (
//             <button
//               className="controlButton mr-auto"
//               onClick={toggleMutedState}
//             >
//               <ShareIcon className="h-6 w-6 text-white" />
//             </button>
//           ) : (
//             <></>
//           )}
//         </div>
//         <div
//           className={`playbackControls p-1.5 absolute bg-black/20 backdrop-blur-md backdrop-saturate-150 border border-white/20 px-4 rounded-lg transition-opacity duration-300 ease-in-out ${
//             isFullScreen ? "top-10 left-10" : "top-5 left-5"
//           } ${
//             canShowControls ? "opacity-100" : "opacity-0 pointer-events-none"
//           }`}
//         >
//           {isMuted ? (
//             <button
//               className="controlButton mr-auto"
//               onClick={toggleMutedState}
//             >
//               <SpeakerXMarkIcon className="h-6 w-6 text-white" />
//             </button>
//           ) : (
//             <div ref={audioIconRef} className={`flex flex-row gap-2`}>
//               <button
//                 className="controlButton mr-auto"
//                 onClick={toggleMutedState}
//               >
//                 <SpeakerWaveIcon className="h-6 w-6 text-white" />
//               </button>
//               <input
//                 type="range"
//                 min="0"
//                 max="1"
//                 step="0.01"
//                 value={audioLevel}
//                 className={`volume-slider accent-red-600 transition-all duration-500 overflow-hidden cursor-pointer ${
//                   canShowAudioSlider
//                     ? "opacity-100"
//                     : "opacity-0 pointer-events-none h-0 w-0"
//                 }`}
//                 id="volumeSlider"
//                 onClick={(e) => e.stopPropagation()}
//                 onChange={setVolumeLevel}
//               ></input>
//             </div>
//           )}
//           {shareLink ? (
//             <button
//               className="controlButton mr-auto"
//               onClick={toggleMutedState}
//             >
//               <ShareIcon className="h-6 w-6 text-white" />
//             </button>
//           ) : (
//             <></>
//           )}
//         </div>
//       </div>
//     );
//   }
// );

export function VideoPlayer({
  videoURL,
  stream,
  getRef,
  videoMeta,
  onManualPause,
  onManualResume,
}: videoURLProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoWrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (getRef) {
      getRef.current = videoRef.current;
    }
    if (videoRef.current && stream) {
      // @ts-ignore
      videoRef.current.setSrcObject(stream);
    }
  }, []);
  return (
    <div
      className="video-player relative flex justify-center align-middle h-full w-fit max-h-full max-w-h-full"
      ref={videoWrapperRef}
    >
      <video
        ref={videoRef}
        src={videoURL}
        autoPlay
        controls={false}
        playsInline
        className="rounded-lg"
      ></video>
      <VideoPlayerControls
        videoRef={videoRef}
        videoMeta={videoMeta}
        videoWrapperRef={videoWrapperRef}
        onManualPause={onManualPause}
        onManualResume={onManualResume}
      ></VideoPlayerControls>
    </div>
  );
}

export default VideoPlayer;
