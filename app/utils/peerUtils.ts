import SimplePeer, { SignalData } from "simple-peer";
import { Socket } from "socket.io-client";
import { MutableRefObject } from "react";

type SocketSignal = {
  signalData: SignalData;
  to: string;
};

type PeerParams = {
  isInitiator: boolean;
  mediaStream?: MediaStream;
  receiverId?: string;
  socket?: MutableRefObject<Socket | null>;
  onConnect?: () => void;
  onDataReceived?: (data: any) => void;
  onStream?: (stream: MediaStream) => void;
};

function convertPeerSignalToSocketSignal(
  data: SignalData,
  receiverId: string
): SocketSignal {
  return {
    signalData: data,
    to: receiverId,
  };
}

export function createPeer(params: PeerParams) {
  const peerConfig = {
    trickle: false,
    initiator: false,
  };

  if (params.isInitiator && params.mediaStream) {
    peerConfig.initiator = true;
  }
  const peer = new SimplePeer(peerConfig);

  peer.on("signal", (data) => {
    const socketSignal = convertPeerSignalToSocketSignal(
      data,
      params.receiverId as string
    );
    const socket = params.socket ? params.socket.current : null;
    socket && socket.connected && socket.emit("signal", socketSignal);
  });

  peer.on("connect", () => {
    console.log(`Successfully connected to peer ${params.receiverId}`);
    if (params.isInitiator && params.mediaStream) {
      peer.addStream(params.mediaStream);
    }
    params.onConnect && params.onConnect();
  });

  peer.on("stream", (stream: MediaStream) => {
    console.log("Received stream from host peer");
    params.onStream && params.onStream(stream);
  });

  peer.on("data", (data) => {
    params.onDataReceived && params.onDataReceived(data);
  });

  peer.on("close", () => {
    console.log("Peer-to-peer connection closed.");
    if (!params.mediaStream) return;
    params.mediaStream.getTracks().forEach((track) => track.stop());
  });

  peer.on("error", (err) => {
    console.error("Peer-to-peer connection error : ", err);
    if (!params.mediaStream) return;
    params.mediaStream.getTracks().forEach((track) => track.stop());
  });

  return peer;
}
