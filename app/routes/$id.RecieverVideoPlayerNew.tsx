import {
  useRef,
  useContext,
  MutableRefObject,
  useState,
  useEffect,
  RefObject,
} from "react";
import { VideoPlayer } from "../features/videoPlayback/components/VideoPlayer";
import { createPeer } from "~/utils/peerUtils";
import UserNameContext from "../context/UserName/UserNameContext";
import RoomIdContext from "../context/RoomId/RoomIdContext";
import SimplePeer from "simple-peer";
import { createSocket } from "~/utils/socketUtils";
import { Socket } from "socket.io-client";
import {
  pausedPlaybackMessage,
  resumedPlaybackMessage,
  forwardedPlaybackMessage,
  rewindedPlaybackMessage,
  seekPlaybackMessage,
} from "~/toastMessages/toastMessageLibrary";
import PeerDataChannelUtil from "~/utils/peerDataChannelUtil";
export default function RecieverVideoPlayerNew() {
  const videoRef = useRef(null);
  const peerId = useRef(null);
  const hostPeerId = useRef(null);
  const peerRef: MutableRefObject<SimplePeer.Instance | null> = useRef(null);
  const peerDataChannelRef: RefObject<PeerDataChannelUtil | null> =
    useRef(null);
  const socketRef: MutableRefObject<Socket | null> = useRef(null);
  const [videoMeta, setVideoMeta] = useState({
    currentTime: 0,
    duration: 0,
  });
  const { userName } = useContext(UserNameContext);
  const { roomId } = useContext(RoomIdContext);

  function sendPauseSignal() {
    if (!peerRef.current || !videoRef.current) return;
    if (!peerDataChannelRef.current) {
      peerDataChannelRef.current = new PeerDataChannelUtil(
        videoRef.current as HTMLVideoElement,
        peerRef.current
      );
    }
    peerDataChannelRef.current.sendPauseSignal(userName);
  }

  function sendResumeSignal() {
    if (!peerRef.current || !videoRef.current) return;
    if (!peerDataChannelRef.current) {
      peerDataChannelRef.current = new PeerDataChannelUtil(
        videoRef.current as HTMLVideoElement,
        peerRef.current
      );
    }
    peerDataChannelRef.current.sendResumeSignal(userName);
  }

  function sendForwardSignal() {
    if (!peerRef.current || !videoRef.current) return;
    if (!peerDataChannelRef.current) {
      peerDataChannelRef.current = new PeerDataChannelUtil(
        videoRef.current as HTMLVideoElement,
        peerRef.current
      );
    }
    peerDataChannelRef.current.sendForwardSignal(userName);
  }

  function sendRewindSignal() {
    if (!peerRef.current || !videoRef.current) return;
    if (!peerDataChannelRef.current) {
      peerDataChannelRef.current = new PeerDataChannelUtil(
        videoRef.current as HTMLVideoElement,
        peerRef.current
      );
    }
    peerDataChannelRef.current.sendRewindSignal(userName);
  }

  function sendManualSeek(time) {
    if (!peerRef.current || !videoRef.current) return;
    if (!peerDataChannelRef.current) {
      peerDataChannelRef.current = new PeerDataChannelUtil(
        videoRef.current as HTMLVideoElement,
        peerRef.current
      );
    }
    peerDataChannelRef.current.sendSeekSignal(userName, time);
  }

  useEffect(() => {
    const socketParams = {
      userName,
      roomId,
      onReceivingSocketMetaCallback: (data) => {
        peerId.current = data.peerId;
        peerRef.current = createPeer({
          isInitiator: false,
          socket: socketRef,
          onStream: (stream) => {
            const videoTrack = stream.getVideoTracks()[0];
            videoTrack.addEventListener("unmute", () => {
              if (videoRef.current) {
                if ("srcObject" in videoRef.current) {
                  videoRef.current.srcObject = stream;
                } else {
                  videoRef.current.src = URL.createObjectURL(stream);
                }
              }
            });
          },
          onDataReceived: (channelData) => {
            const data = channelData ? JSON.parse(channelData) : null;
            if (!data || !data.type || !videoRef.current) return;
            switch (data.type) {
              case "video-duration":
                setVideoMeta((prevVideoMeta) => ({
                  ...prevVideoMeta,
                  duration: data.duration,
                }));
                break;
              case "video-current-time":
                setVideoMeta((prevVideoMeta) => ({
                  ...prevVideoMeta,
                  currentTime: data.currentTime,
                }));
                break;
              case "pause-playback":
                pausedPlaybackMessage(data.userName);
                if (!videoRef.current.paused) {
                  videoRef.current.dispatchEvent(new Event(data.type));
                }
                break;
              case "resume-playback":
                resumedPlaybackMessage(data.userName);
                if (videoRef.current.paused) {
                  videoRef.current.dispatchEvent(new Event(data.type));
                }
                break;
              case "forward-playback":
                forwardedPlaybackMessage(data.userName);
                if (videoRef.current) {
                  videoRef.current.dispatchEvent(new Event(data.type));
                }
                break;
              case "rewind-playback":
                rewindedPlaybackMessage(data.userName);
                if (videoRef.current) {
                  videoRef.current.dispatchEvent(new Event(data.type));
                }
                break;
              case "seek-playback":
                seekPlaybackMessage(data.userName);
                if (videoRef.current) {
                  videoRef.current.dispatchEvent(new Event(data.type));
                }
                break;
            }
          },
        });
      },
      onSignalCallback: (data) => {
        hostPeerId.current = data.peerId;
        if (peerRef.current) {
          peerRef.current.signal(data.signalData);
        }
      },
    };
    socketRef.current = createSocket(socketParams);

    return () => {
      socketRef.current?.disconnect();
    };
  }, []);

  return (
    <div className="h-[90%] w-[90%] md:h-3/4 md:w-3/4 min-h-3/4 min-w-3/4 rounded-md flex justify-center items-center md:p-[2em] m-auto">
      <VideoPlayer
        videoURL={""}
        getRef={videoRef}
        videoMeta={videoMeta}
        onManualPause={sendPauseSignal}
        onManualResume={sendResumeSignal}
        onManualForward={sendForwardSignal}
        onManualRewind={sendRewindSignal}
        onManualSeek={sendManualSeek}
      />
    </div>
  );
}
