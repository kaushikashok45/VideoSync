import { useRef, useEffect, useState, useContext, EventHandler } from "react";
import { useLocation } from "@remix-run/react";
import SimplePeer from "simple-peer";
import { io } from "socket.io-client";
import {
  peerDataChannelObject,
  peerSignal,
  videoPlaybackControlMeta,
} from "~/utils/peerSignalContract";
import createHostPeer from "~/utils/createHostPeer";
import UserNameContext from "~/routes/UserNameContext";
import { peerMeta, peerSetupMeta } from "~/utils/peerRegistryContract";
import { joinedPartySuccessMessage } from "~/toastMessages/toastMessageLibrary";
import RoomIdContext from "./RoomIdContext";
import { VideoPlayer } from "./VideoCanvas";

export default function HostVideoPlayer() {
  const location = useLocation();
  const passedState = location.state as { videoURL: string };
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const peerMap = new Map<string, peerMeta>();
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const peerId = useRef<string>("");
  const { userName } = useContext(UserNameContext);
  const { roomId } = useContext(RoomIdContext);
  const [shareLink, setShareLink] = useState<string | null>(null);

  useEffect(() => {
    const SOCKET_SERVER_URL = `${window.location.protocol}//localhost:3001`;
    setShareLink(
      `${window.location.protocol}//${window.location.host}?roomId=${roomId}`
    );
    const socket = io(SOCKET_SERVER_URL);
    console.log(location);
    socket.on("connect", () => {
      console.log("Connected to socket IO server");
      socket.emit("join-room", {
        userName: userName,
        roomId,
      });
    });

    socket.on("user-joined", (data: peerSetupMeta) => {
      console.log("User joined data:", data);
      const { userName, peerId } = data;
      console.log(
        `${userName}:${peerId} joined the room.Setting up P2P connection...`
      );
      joinedPartySuccessMessage(userName);
      startStreaming(peerId, userName);
    });

    socket.on("socket-id-meta", (data) => {
      console.log("Received socket id:", data);
      peerId.current = data.peerId;
    });

    socket.on("signal", (data: peerSignal) => {
      console.log("Received signal from socket IO server", data);
      if (peerMap.has(data.peerId) && peerMap.get(data.peerId) !== undefined) {
        const { peerInstance } = peerMap.get(data.peerId) as {
          peerInstance: SimplePeer.Instance;
        };
        peerInstance.signal(data.signalData);
      }
    });

    socket.on("disconnect", () => {
      console.log("Disconnected from socket IO server");
    });

    socket.on("connect_error", (err) => {
      console.error("Error connecting to socket IO server", err.message);
    });

    const startStreaming = (peerId: string, userName: string) => {
      if (!socket?.connected) {
        console.error("Not connected to socket IO server");
        return;
      }
      console.log(`Streaming starts...`);

      if (videoRef.current) {
        if (mediaStreamRef.current === null) {
          // @ts-ignore
          mediaStreamRef.current = videoRef.current.captureStream(); //TODO:This works only in Chrome.Develop a polyfill for other unsupported browsers.
        }

        // @ts-ignore
        const peer = createHostPeer(
          mediaStreamRef.current as MediaStream,
          socket,
          peerId,
          videoRef,
          userName,
          peerId.current
        );
        peerMap.set(peerId, {
          userName,
          peerInstance: peer,
        });
      }
    };

    const pausePlaybackForAllPeers = (
      e: CustomEvent<videoPlaybackControlMeta>
    ) => {
      const { peerId, userName } = e.detail;
      const dataObject: peerDataChannelObject = {
        action: "pause-playback",
        peerId: peerId,
        userName: userName,
        data: {},
      };
      const dataString = JSON.stringify(dataObject);
      peerMap.forEach((peerMeta) => peerMeta.peerInstance.send(dataString));
    };

    const resumePlaybackForAllPeers = (
      e: CustomEvent<videoPlaybackControlMeta>
    ) => {
      // @ts-ignore
      const duration = videoRef.current?.getDuration();
      // @ts-ignore
      const currentTime = videoRef.current?.getCurrentTime();
      const { peerId, userName } = e.detail;
      const dataObject: peerDataChannelObject = {
        action: "resume-playback",
        userName: userName,
        peerId: peerId,
        data: {
          duration: duration,
          currentTime: currentTime,
        },
      };
      const dataString = JSON.stringify(dataObject);
      peerMap.forEach((peerMeta) => peerMeta.peerInstance.send(dataString));
    };

    const triggerPausePlaybackFromHost = () => {
      const payload: videoPlaybackControlMeta = {
        userName: userName,
        peerId: peerId.current,
        target: videoRef.current as HTMLVideoElement,
      };
      // @ts-ignore
      videoRef.current?.triggerEvent("pause-video-for-all-peers", payload);
    };

    const triggerResumePlaybackFromHost = () => {
      const payload: videoPlaybackControlMeta = {
        userName: userName,
        peerId: peerId.current,
        target: videoRef.current as HTMLVideoElement,
      };
      // @ts-ignore
      videoRef.current?.triggerEvent("play-video-for-all-peers", payload);
    };

    videoRef.current?.addEventListener(
      "pause-video-for-all-peers",
      pausePlaybackForAllPeers as EventHandler<any>
    );
    videoRef.current?.addEventListener(
      "play-video-for-all-peers",
      resumePlaybackForAllPeers as EventHandler<any>
    );
    videoRef.current?.addEventListener("pause", triggerPausePlaybackFromHost);
    videoRef.current?.addEventListener("play", triggerResumePlaybackFromHost);

    return () => {
      console.log("Disconnecting from socket IO server");
      socket.disconnect();
      console.log("Destroying peers");
      peerMap.forEach((peerMeta) => peerMeta.peerInstance.destroy());
      videoRef.current?.removeEventListener(
        "pause-video-for-all-peers",
        pausePlaybackForAllPeers as EventHandler<any>
      );
      videoRef.current?.removeEventListener(
        "play-video-for-all-peers",
        resumePlaybackForAllPeers as EventHandler<any>
      );
      videoRef.current?.removeEventListener(
        "pause",
        triggerPausePlaybackFromHost
      );
      videoRef.current?.removeEventListener(
        "play",
        triggerResumePlaybackFromHost
      );
    };
  }, []);

  return (
    <div id="host-video-player-container">
      {/*<VideoCanvas
        videoURL={passedState.videoURL}
        ref={videoRef}
        shareLink={shareLink}
      />*/}
      <VideoPlayer
        videoURL={passedState.videoURL}
        getRef={videoRef}
      ></VideoPlayer>
    </div>
  );
}
