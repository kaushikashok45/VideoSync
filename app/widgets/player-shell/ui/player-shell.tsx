import { useRef, useState, useSyncExternalStore } from "react";
import type { MediaSource } from "contracts/media-source.ts";
import type { Member } from "contracts/member.ts";
import type { MovieMetadata } from "contracts/movie-metadata.ts";
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
import { useIdleVisibility } from "../logic/use-idle-visibility.ts";
import { useLocalFileSource } from "../logic/use-local-file-source.ts";
import ControlBar from "./control-bar.tsx";
import PlaybackSync, { type PlaybackSyncHandle } from "./playback-sync.tsx";
import PlayerFeedback from "./player-feedback.tsx";

export interface PlayerShellProps {
  mode: "host" | "receiver";
  media: MediaSource | { url?: string };
  metadata?: MovieMetadata | null;
  me?: Member | null;
  roomId?: string;
  file?: File | null;
  idleMs?: number;
  playbackStore?: PlaybackStore;
  membersStore?: MembersStore;
  chatStore?: ChatStore;
  reactionStore?: ReactionStore;
}

const DRIFT_THRESHOLD_MS = 1500;

function videoSource(media: PlayerShellProps["media"]): string | undefined {
  if ("mode" in media) {
    if (media.mode === "url") return media.url;
    return undefined;
  }
  return media.url;
}

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
}: PlayerShellProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const syncHandleRef = useRef<PlaybackSyncHandle>(null);
  const storeRef = useRef<PlaybackStore | null>(playbackStore ?? null);
  if (!storeRef.current) {
    storeRef.current = createPlaybackStore({
      driftThresholdMs: DRIFT_THRESHOLD_MS,
    });
  }
  const membersRef = useRef<MembersStore | null>(membersStore ?? null);
  if (!membersRef.current) membersRef.current = createMembersStore();
  const chatRef = useRef<ChatStore | null>(chatStore ?? null);
  if (!chatRef.current) chatRef.current = createChatStore();
  const reactionRef = useRef<ReactionStore | null>(reactionStore ?? null);
  if (!reactionRef.current) reactionRef.current = createReactionStore();
  const store = storeRef.current;
  const { visible, reveal } = useIdleVisibility(idleMs);
  const snapshot = useSyncExternalStore(
    store.subscribe,
    () => store.getState().getSnapshot(),
    () => undefined,
  );

  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const src = useLocalFileSource(mode, file) ?? videoSource(media);
  const awaitingSource = src === undefined;

  return (
    <div
      data-testid="player-shell"
      role="group"
      aria-label={mode === "host" ? "Host player" : "Receiver player"}
      tabIndex={0}
      onPointerMove={reveal}
      onKeyDown={reveal}
      onClick={reveal}
      className="relative h-dvh min-h-0 w-full max-w-none overflow-hidden rounded-none bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-text focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
    >
      <video
        ref={videoRef}
        src={src}
        autoPlay={mode === "host" && !autoplayBlocked}
        preload="metadata"
        playsInline
        className="h-full w-full bg-black object-contain"
        data-testid="player-video"
      />
      <PlayerFeedback
        mode={mode}
        src={src}
        awaitingSource={awaitingSource}
        autoplayBlocked={autoplayBlocked}
        visible={visible}
        metadata={metadata}
        onPlayWithSound={() => {
          setAutoplayBlocked(false);
          store.getState().play();
        }}
      />
      <ControlBar
        hidden={!visible}
        me={me}
        store={store}
        snapshot={snapshot}
        syncHandleRef={syncHandleRef}
      />
      <PlaybackSync
        store={store}
        videoRef={videoRef}
        actionRef={syncHandleRef}
        autoplay={mode === "host" && Boolean(src)}
        onAutoplayBlocked={() => setAutoplayBlocked(true)}
      />
      <RoomSidebar
        roomId={roomId}
        me={me}
        membersStore={membersRef.current}
        chatStore={chatRef.current}
        reactionStore={reactionRef.current}
      />
      <ReactionOverlay
        reactionStore={reactionRef.current}
        membersStore={membersRef.current}
      />
    </div>
  );
}
