import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import type { RefObject } from "react";
import SimplePeer from "simple-peer";
import type { MembersStore } from "~/entities/member/members-store.ts";
import type { SocketClient } from "~/shared/api/socket-client.ts";

export interface PeerMediaStreamProps {
  mode: "host" | "receiver";
  videoRef: RefObject<HTMLVideoElement | null>;
  socket: SocketClient | null;
  membersStore: MembersStore;
}

type Peer = SimplePeer.Instance;

function capture(video: HTMLVideoElement): MediaStream | null {
  const element = video as HTMLVideoElement & {
    captureStream?: () => MediaStream;
  };
  return element.captureStream?.() ?? null;
}

function peerFor(
  initiator: boolean,
  stream: MediaStream | undefined,
  peerId: string,
  socket: SocketClient,
  onStream?: (stream: MediaStream) => void,
): Peer {
  const peer = new SimplePeer({ initiator, trickle: false, stream });
  peer.on("signal", (data) => socket.sendSignal(peerId, data));
  peer.on("stream", (remote) => onStream?.(remote));
  return peer;
}

export function usePeerMediaStream({
  mode,
  videoRef,
  socket,
  membersStore,
}: PeerMediaStreamProps): MediaStream | null {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const members = useSyncExternalStore(
    membersStore.subscribe,
    () => membersStore.getState().members,
    () => [],
  );
  const peersRef = useRef(new Map<string, Peer>());
  const hostId = members.find((member) => member.role === "host")?.id;

  useEffect(() => {
    if (mode !== "host") return;
    const video = videoRef.current;
    if (!video) return;
    const update = () => setLocalStream(capture(video));
    video.addEventListener("loadedmetadata", update);
    if (video.readyState >= 1) update();
    return () => {
      video.removeEventListener("loadedmetadata", update);
      localStream?.getTracks().forEach((track) => track.stop());
    };
  }, [mode, videoRef]);

  useEffect(() => {
    if (!socket) return;
    const peers = peersRef.current;
    const create = (peerId: string, initiator: boolean) => {
      if (peers.has(peerId)) return;
      peers.set(
        peerId,
        peerFor(
          initiator,
          initiator ? localStream ?? undefined : undefined,
          peerId,
          socket,
          setRemoteStream,
        ),
      );
    };
    if (mode === "host" && localStream) {
      members.filter((member) => member.role !== "host").forEach((member) =>
        create(member.id, true)
      );
    }
    if (mode === "receiver" && hostId) create(hostId, false);
    const removeSignal = socket.onSignal(({ peerId, signalData }) => {
      peers.get(peerId)?.signal(signalData as SimplePeer.SignalData);
    });
    return () => {
      if (typeof removeSignal === "function") removeSignal();
      peers.forEach((peer) => peer.destroy());
      peers.clear();
    };
  }, [hostId, localStream, members, mode, socket]);

  return remoteStream;
}
