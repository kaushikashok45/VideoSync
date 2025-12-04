import {
  useRef,
  useContext,
  useEffect,
  MutableRefObject,
  useMemo,
} from "react";
import { useLocation } from "@remix-run/react";
import { VideoPlayer } from "./VideoCanvas";
import { createSocket } from "../utils/socketUtils";
import UserNameContext from "~/routes/UserNameContext";
import RoomIdContext from "./RoomIdContext";
import { peerSetupMeta, peerMeta } from "~/utils/peerRegistryContract";
import { createPeer } from "~/utils/peerUtils";
import { Socket } from "socket.io-client";
import SimplePeer from "simple-peer";
import PeerDataChannelUtil from "~/utils/peerDataChannelUtil";
import {
  pausedPlaybackMessage,
  resumedPlaybackMessage,
} from "~/toastMessages/toastMessageLibrary";
import { isFirefox } from "~/utils/videoPlayerUtils";

export default function HostVideoPlayerNew() {
  const location = useLocation();
  const passedState = location.state as { videoURL: string };
  const videoRef = useRef<HTMLVideoElement>(null);
  const socketRef: MutableRefObject<Socket | null> = useRef(null);
  const mediaStreamRef: MutableRefObject<MediaStream> = useRef(null);
  const peerDataChannelUtilRef: MutableRefObject<PeerDataChannelUtil | null> =
    useRef(null);
  const { userName } = useContext(UserNameContext);
  const { roomId } = useContext(RoomIdContext);
  const peerId = useRef<string | null>(null);
  const peerMap = useRef(new Map<string, peerMeta>());
  const socketParams = useMemo(() => {
    return {
      userName,
      roomId,
      onUserJoinCallback: (data: peerSetupMeta) => {
        const { userName, peerId } = data;
        if (!videoRef.current) {
          console.warn(
            "Attempted to initialize host peer without video element."
          );
          return;
        }
        if (videoRef.current && !mediaStreamRef.current) {
          mediaStreamRef.current = isFirefox()
            ? videoRef.current.mozCaptureStream()
            : videoRef.current.captureStream();
        }
        const peer = createPeer({
          isInitiator: true,
          receiverId: peerId,
          mediaStream: mediaStreamRef.current,
          socket: socketRef,
          onDataReceived: (channelData) => {
            const data = channelData ? JSON.parse(channelData) : null;
            if (!data || !data.type || !videoRef.current) return;
            switch (data.type) {
              case "pause-playback":
                pausedPlaybackMessage(data.userName);
                if (!videoRef.current.paused) {
                  const pausePayload = {
                    detail: {
                      userName: data.userName,
                    },
                  };
                  const pausePlaybackEvent = new CustomEvent(
                    data.type,
                    pausePayload
                  );
                  videoRef.current.dispatchEvent(pausePlaybackEvent);
                }
                break;
              case "resume-playback":
                resumedPlaybackMessage(data.userName);
                if (videoRef.current.paused) {
                  const resumePlaybackEvent = new CustomEvent(data.type, {
                    detail: {
                      userName: data.userName,
                    },
                  });
                  videoRef.current.dispatchEvent(resumePlaybackEvent);
                }
                break;
            }
          },
        });
        peer?.on("connect", () => {
          peerDataChannelUtilRef.current = new PeerDataChannelUtil(
            videoRef.current as HTMLVideoElement,
            peer
          );
          const storedPeer = peerMap.current.get(peerId);
          if (storedPeer) {
            peerMap.current.set(peerId, {
              ...storedPeer,
              peerDataChannel:
                peerDataChannelUtilRef.current as PeerDataChannelUtil,
            });
          }
          peerDataChannelUtilRef.current.sendVideoDuration();
          setInterval(() => {
            if (videoRef.current?.paused) return;
            peerDataChannelUtilRef.current?.sendVideoCurrentTime();
          }, 1000);
        });
        peerMap.current.set(peerId, {
          userName,
          peerInstance: peer,
          peerDataChannel:
            peerDataChannelUtilRef.current as PeerDataChannelUtil,
        });
      },
      onReceivingSocketMetaCallback: (data) => {
        peerId.current = data.peerId;
      },
      onSignalCallback: (data) => {
        if (
          peerMap.current.has(data.peerId) &&
          peerMap.current.get(data.peerId) !== undefined
        ) {
          const { peerInstance } = peerMap.current.get(data.peerId) as {
            peerInstance: SimplePeer.Instance;
          };
          peerInstance.signal(data.signalData);
        }
      },
    };
  }, []);

  function pausePlaybackForAllPeers(e) {
    const initiator = e && e.detail.userName ? e.detail.userName : userName;
    peerMap.current.forEach((peerMeta) => {
      if (initiator !== peerMeta.userName) {
        const { peerDataChannel } = peerMeta;
        peerDataChannel.sendPauseSignal(initiator);
      }
    });
  }

  function resumePlaybackForAllPeers(e) {
    const initiator = e && e.detail.userName ? e.detail.userName : userName;
    peerMap.current.forEach((peer) => {
      if (initiator !== peer.userName) {
        const { peerDataChannel } = peer;
        peerDataChannel.sendResumeSignal(initiator);
      }
    });
  }

  useEffect(() => {
    socketRef.current = createSocket(socketParams);
    videoRef.current?.addEventListener(
      "pause-playback",
      pausePlaybackForAllPeers
    );
    videoRef.current?.addEventListener(
      "resume-playback",
      resumePlaybackForAllPeers
    );
    return () => {
      socketRef.current?.disconnect();
      videoRef.current?.removeEventListener(
        "pause-playback",
        pausePlaybackForAllPeers
      );
      videoRef.current?.removeEventListener(
        "resume-playback",
        resumePlaybackForAllPeers
      );
    };
  }, []);

  return (
    <div className="h-[90%] w-[90%] md:h-3/4 md:w-3/4 min-h-3/4 min-w-3/4 rounded-md flex justify-center items-center md:p-[2em] m-auto">
      <VideoPlayer
        videoURL={passedState.videoURL}
        getRef={videoRef}
        onManualPause={pausePlaybackForAllPeers}
        onManualResume={resumePlaybackForAllPeers}
      ></VideoPlayer>
    </div>
  );
}
