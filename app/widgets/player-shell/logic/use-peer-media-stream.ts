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
  const localStreamRef = useRef<MediaStream | null>(null);
  localStreamRef.current = localStream;
  const hostId = members.find((member) => member.role === "host")?.id;

  // Capture the host's media once playback starts. captureStream only produces
  // audio frames while the video is playing, so capturing on `playing` (not
  // paused metadata) is what makes audio reach the receiver. Capturing once
  // keeps the stream stable so repeated `playing` events never add duplicate
  // tracks; unmuting the element later makes the captured audio track audible.
  useEffect(() => {
    if (mode !== "host") return;
    const video = videoRef.current;
    if (!video) return;
    let current: MediaStream | null = null;
    const update = () => {
      if (current) return;
      const next = capture(video);
      if (!next) return;
      current = next;
      setLocalStream(next);
    };
    video.addEventListener("playing", update);
    return () => {
      video.removeEventListener("playing", update);
      current?.getTracks().forEach((track) => track.stop());
    };
  }, [mode, videoRef]);

  // Peer lifecycle: create/destroy peers as members change. Independent of the
  // local stream so re-captures never tear down an established connection. A
  // peer created after the host is already playing gets the latest stream
  // immediately via addStream.
  useEffect(() => {
    if (!socket) return;
    const peers = peersRef.current;
    const create = (peerId: string, initiator: boolean) => {
      if (peers.has(peerId)) return;
      const peer = new SimplePeer({ initiator, trickle: false });
      peer.on("signal", (data) => socket.sendSignal(peerId, data));
      peer.on("stream", (remote) => setRemoteStream(remote));
      const stream = localStreamRef.current;
      if (stream) peer.addStream(stream);
      peers.set(peerId, peer);
    };
    if (mode === "host") {
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
  }, [hostId, members, mode, socket]);

  // Attach the latest local stream to every live peer, including peers that
  // connected before the host started playing.
  useEffect(() => {
    if (!localStream) return;
    peersRef.current.forEach((peer) => peer.addStream(localStream));
  }, [localStream]);

  return remoteStream;
}
