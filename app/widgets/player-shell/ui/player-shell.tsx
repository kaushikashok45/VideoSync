import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { type ChatStore, createChatStore } from "~/entities/chat/chat-store.ts";
import {
  createMembersStore,
  type MembersStore,
} from "~/entities/member/members-store.ts";
import {
  createPlaybackStore,
  type PlaybackStore,
} from "~/entities/playback/playback-store.ts";
import {
  createReactionStore,
  type ReactionStore,
} from "~/entities/reaction/reaction-store.ts";
import RoomSidebar from "~/widgets/room-sidebar/ui/room-sidebar.tsx";
import ReactionOverlay from "~/widgets/reaction-overlay/ui/reaction-overlay.tsx";
import type { PlayerShellProps } from "../types/player-shell-props.ts";
import { useIdleVisibility } from "../logic/use-idle-visibility.ts";
import { useLocalFileSource } from "../logic/use-local-file-source.ts";
import { useOptionalSocketClient } from "~/shared/api/socket-bridge.tsx";
import { resolveRoomConnectionState } from "../logic/resolve-room-connection-state.ts";
import { useSocketConnectionState } from "../logic/use-socket-connection-state.ts";
import { usePeerMediaStream } from "../logic/use-peer-media-stream.ts";
import { handleStagePlaybackShortcut } from "~/features/playback-control/model/handle-stage-playback-shortcut.ts";
import ControlBar from "./control-bar.tsx";
import PlaybackSync, { type PlaybackSyncHandle } from "./playback-sync.tsx";
import PlayerFeedback from "./player-feedback.tsx";
import PlayerHeader from "./player-header.tsx";

const DRIFT_THRESHOLD_MS = 1500;

export default function PlayerShell({
  mode,
  media,
  metadata = null,
  me = null,
  roomId = "",
  file = null,
  idleMs = 3000,
  playbackStore,
  membersStore,
  chatStore,
  reactionStore,
  onExit,
}: PlayerShellProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const syncHandleRef = useRef<PlaybackSyncHandle>(null);
  const storeRef = useRef<PlaybackStore | null>(null);
  const membersRef = useRef<MembersStore | null>(null);
  const chatRef = useRef<ChatStore | null>(null);
  const reactionRef = useRef<ReactionStore | null>(null);
  storeRef.current ??= playbackStore ??
    createPlaybackStore({ driftThresholdMs: DRIFT_THRESHOLD_MS });
  membersRef.current ??= membersStore ?? createMembersStore();
  chatRef.current ??= chatStore ?? createChatStore();
  reactionRef.current ??= reactionStore ?? createReactionStore();
  const store = storeRef.current;
  const socket = useOptionalSocketClient();
  useEffect(() => {
    if (mode !== "host" || me === null) return;
    const hostId = socket?.getSocketId() ?? me.id;
    const present = membersRef.current?.getState().members.some((member) =>
      member.id === hostId
    );
    if (!present) {
      membersRef.current?.getState().addMember({ ...me, id: hostId });
    }
  }, [me, mode, socket]);
  const remoteStream = usePeerMediaStream({
    mode,
    videoRef,
    socket,
    membersStore: membersRef.current,
  });
  const { visible, reveal } = useIdleVisibility(idleMs);
  const socketState = useSocketConnectionState(socket);
  const snapshot = useSyncExternalStore(
    store.subscribe,
    () => store.getState().getSnapshot(),
    () => undefined,
  );
  const hostPresent = useSyncExternalStore(
    membersRef.current.subscribe,
    () =>
      membersRef.current?.getState().members.some((member) =>
        member.role === "host"
      ) ?? false,
    () => false,
  );
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const [autoplayError, setAutoplayError] = useState<string | null>(null);
  const [volume, setVolume] = useState(1);
  const [hadRemoteStream, setHadRemoteStream] = useState(false);
  const src = useLocalFileSource(mode, file) ??
    ("mode" in media
      ? (media.mode === "url" ? media.url : undefined)
      : media.url);
  const sourceReady = Boolean(src) || (snapshot?.duration ?? 0) > 0;
  const awaitingSource = !sourceReady && remoteStream === null;
  const connection = resolveRoomConnectionState({
    mode,
    socketState,
    hostPresent,
    hasStream: remoteStream !== null,
    sourceReady,
    hadStream: hadRemoteStream,
  });
  const handleStageKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
  ) => {
    reveal();
    handleStagePlaybackShortcut(event, me, snapshot, store);
  };
  const handlePlayWithSound = async () => {
    if (volume === 0) {
      setVolume(1);
      syncHandleRef.current?.setVolume(1);
    }
    const started = await syncHandleRef.current?.play();
    setAutoplayBlocked(!started);
    setAutoplayError(
      started
        ? null
        : "Playback is still blocked. Use your browser’s play control and try again.",
    );
  };

  useEffect(() => {
    if (remoteStream !== null) {
      setHadRemoteStream(true);
    }
  }, [remoteStream]);

  return (
    <div
      data-testid="player-shell"
      role="group"
      aria-label={mode === "host" ? "Host player" : "Receiver player"}
      tabIndex={0}
      onPointerMove={reveal}
      onKeyDown={handleStageKeyDown}
      onClick={reveal}
      className="relative h-dvh min-h-0 w-full max-w-none overflow-hidden rounded-none bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-text focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
    >
      <video
        ref={videoRef}
        src={src}
        autoPlay={false}
        preload="metadata"
        playsInline
        className="h-full w-full bg-black object-contain"
        data-testid="player-video"
      />
      <PlayerFeedback
        mode={mode}
        connectionState={connection.stage}
        src={src}
        hasStream={remoteStream !== null}
        hostPresent={hostPresent}
        awaitingSource={awaitingSource}
        autoplayBlocked={autoplayBlocked}
        autoplayError={autoplayError}
        visible={visible}
        metadata={metadata}
        onPlay={handlePlayWithSound}
        snapshot={snapshot}
      />
      <PlayerHeader roomId={roomId} onExit={onExit} />
      <ControlBar
        hidden={!visible}
        me={me}
        volume={volume}
        onVolumeChange={setVolume}
        store={store}
        snapshot={snapshot}
        syncHandleRef={syncHandleRef}
      />
      <PlaybackSync
        mode={mode}
        store={store}
        videoRef={videoRef}
        actionRef={syncHandleRef}
        stream={remoteStream}
        autoplay={mode === "receiver" && remoteStream !== null}
        onAutoplayBlocked={() => {
          setAutoplayBlocked(true);
          setAutoplayError(null);
        }}
      />
      <RoomSidebar
        roomId={roomId}
        connectionLabel={connection.label}
        me={me}
        membersStore={membersRef.current}
        chatStore={chatRef.current}
        reactionStore={reactionRef.current}
        socket={socket}
      />
      <ReactionOverlay
        reactionStore={reactionRef.current}
        membersStore={membersRef.current}
      />
    </div>
  );
}
