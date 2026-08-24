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
import { applyPlayback } from "~/features/playback-control/model/playback-behaviour.ts";
import ControlBar from "./control-bar.tsx";
import PlaybackSync, { type PlaybackSyncHandle } from "./playback-sync.tsx";
import PlayerFeedback from "./player-feedback.tsx";
import PlayerHeader from "./player-header.tsx";
import ReactionTray from "~/widgets/reaction-overlay/ui/reaction-tray.tsx";
import { useSeekerBehaviour } from "../logic/use-seeker-behaviour.ts";
import { copyRoomCode } from "~/features/room-controls/model/host-tools-behaviour.ts";
import { toast } from "sonner";

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
  const stageRef = useRef<HTMLDivElement>(null);
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
  const [mediaTime, setMediaTime] = useState(0);
  const currentTime = snapshot?.status === "playing"
    ? mediaTime
    : snapshot?.currentTime ?? 0;
  const duration = snapshot?.duration ?? 0;
  const seeker = useSeekerBehaviour(
    currentTime,
    duration,
    (target) => applyPlayback("seek", me, store.getState(), target),
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
  const [reactionOpen, setReactionOpen] = useState(false);
  const [roomOpen, setRoomOpen] = useState(true);
  const [roomTab, setRoomTab] = useState<"chat" | "members">("chat");
  const [isMinimized, setIsMinimized] = useState(true);
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
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const updateTime = () => setMediaTime(video.currentTime);
    video.addEventListener("timeupdate", updateTime);
    video.addEventListener("loadedmetadata", updateTime);
    return () => {
      video.removeEventListener("timeupdate", updateTime);
      video.removeEventListener("loadedmetadata", updateTime);
    };
  }, [remoteStream, src]);
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
    syncHandleRef.current?.setVolume(volume || 1);
    const started = await syncHandleRef.current?.play();
    setAutoplayBlocked(!started);
    setAutoplayError(
      started
        ? null
        : "Playback is still blocked. Use your browser’s play control and try again.",
    );
  };
  const handleShare = async () => {
    const shareLink = typeof globalThis.location === "undefined"
      ? roomId
      : new URL(`/${roomId}`, globalThis.location.origin).toString();
    const copied = await copyRoomCode(shareLink);
    if (copied) toast.success("Room link copied");
    else toast.error("Unable to copy room link");
  };

  useEffect(() => {
    if (remoteStream !== null) {
      setHadRemoteStream(true);
    }
  }, [remoteStream]);

  return (
    <div
      data-testid="player-shell"
      ref={stageRef}
      role="group"
      aria-label={mode === "host" ? "Host player" : "Receiver player"}
      tabIndex={0}
      onPointerMove={reveal}
      onKeyDown={handleStageKeyDown}
      onClick={reveal}
      className={`player-stage is-cinema min-h-0 max-w-none overflow-hidden bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-text focus-visible:ring-offset-2 focus-visible:ring-offset-bg ${
        isMinimized ? "is-minimized" : ""
      }`}
    >
      <video
        ref={videoRef}
        src={src}
        autoPlay
        preload="metadata"
        playsInline
        controls={false}
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
        metadata={metadata}
        onPlay={handlePlayWithSound}
        snapshot={snapshot}
      />
      <PlayerHeader
        roomId={roomId}
        onOpenRoom={(tab) => {
          setRoomTab(tab);
          setRoomOpen(true);
        }}
        onExit={onExit}
        minimal={isMinimized}
      />
      <ControlBar
        hidden={!visible && snapshot?.status !== "paused"}
        me={me}
        volume={volume}
        onVolumeChange={setVolume}
        store={store}
        snapshot={snapshot}
        syncHandleRef={syncHandleRef}
        seekerValue={seeker.value}
        onSeekPreview={seeker.preview}
        onSeekCommit={seeker.commit}
        isMinimized={isMinimized}
        onToggleMinimize={() => {
          setIsMinimized((current) => {
            const next = !current;
            setRoomTab("chat");
            setRoomOpen(next);
            return next;
          });
        }}
        onShare={handleShare}
      />
      <div
        className={`pointer-events-none absolute bottom-[clamp(7rem,12vh,9rem)] left-1/2 z-20 -translate-x-1/2 transition-[opacity,transform] duration-300 motion-reduce:transition-none ${
          visible ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
        aria-hidden={!visible || undefined}
      >
        <div className="pointer-events-auto">
          <ReactionTray
            open={reactionOpen}
            onToggle={() => setReactionOpen((current) => !current)}
            onReact={(emoji) => {
              const senderName = me?.name ?? "You";
              if (socket === null) {
                reactionRef.current?.getState().send(emoji, senderName);
              } else {
                socket.sendReaction(emoji, senderName);
              }
              setReactionOpen(false);
            }}
          />
        </div>
      </div>
      <PlaybackSync
        mode={mode}
        store={store}
        videoRef={videoRef}
        fullscreenRef={stageRef}
        actionRef={syncHandleRef}
        stream={remoteStream}
        autoplay={mode === "host" || remoteStream !== null}
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
        open={roomOpen}
        onOpenChange={setRoomOpen}
        openTab={roomTab}
        showToggle={false}
        integrated={isMinimized}
        onExit={onExit}
      />
      <ReactionOverlay
        reactionStore={reactionRef.current}
        membersStore={membersRef.current}
      />
    </div>
  );
}
