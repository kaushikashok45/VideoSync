import { useContext, useEffect, useSyncExternalStore } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import type { MediaSource } from "contracts/media-source.ts";
import type { Member } from "contracts/member.ts";
import SessionContext from "~/context/Session/logic/SessionContext.ts";
import { readHostSessionRoom } from "../logic/host-session-room.ts";
import { resolveRoomState } from "../logic/resolve-room-state.ts";
import { useEnsureHostRoom } from "../logic/use-ensure-host-room.ts";
import { hostSourceStore } from "~/features/media-source/model/host-source-store.ts";
import {
  useOptionalAppStores,
  useOptionalSocketClient,
} from "~/shared/api/socket-bridge.tsx";
import { Button } from "~/shared/ui-kit/index.ts";
import { EntryLayout } from "./entry-layout.tsx";
import PlayerShell from "~/widgets/player-shell/ui/player-shell.tsx";

export function HostPlaybackScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const passedState = location.state as { videoURL?: string } | null;
  const handoff = useSyncExternalStore(
    hostSourceStore.subscribe,
    () => hostSourceStore.getState(),
    () => hostSourceStore.getState(),
  );
  const stores = useOptionalAppStores();
  const socket = useOptionalSocketClient();
  const { roomId: sessionRoomId, updateRoomId, userName } = useContext(
    SessionContext,
  );
  const roomState = resolveRoomState(id, sessionRoomId);
  const storedHostRoom = readHostSessionRoom();
  const isStoredHostRoom = roomState.kind !== "invalid" &&
    storedHostRoom === roomState.roomId;
  const recovering = useEnsureHostRoom({
    enabled: isStoredHostRoom,
    roomId: roomState.kind === "invalid" ? "" : roomState.roomId,
    sourceLabel: "playback",
  });
  const roomId = roomState.kind === "invalid"
    ? sessionRoomId
    : roomState.roomId;
  const media: MediaSource | null = handoff.source ??
    (passedState?.videoURL ? { mode: "url", url: passedState.videoURL } : null);

  useEffect(() => {
    if (
      roomState.kind !== "invalid" &&
      storedHostRoom !== null &&
      storedHostRoom !== roomState.roomId
    ) {
      navigate(
        location.pathname.replace(/^\/[^/]+/, `/${storedHostRoom}`) +
          location.search,
        { replace: true },
      );
      return;
    }
    if (roomState.kind === "invalid" || sessionRoomId === roomState.roomId) {
      return;
    }
    updateRoomId(roomState.roomId);
  }, [
    location.pathname,
    location.search,
    navigate,
    roomState,
    sessionRoomId,
    storedHostRoom,
    updateRoomId,
  ]);

  useEffect(() => {
    if (roomState.kind === "invalid") return;
    if (media !== null) return;
    navigate(`/${roomId}/file-upload`, {
      replace: true,
      state: {
        notice: "Choose the source again to reopen the host room.",
      },
    });
  }, [media, navigate, roomId, roomState.kind]);

  useEffect(() => () => hostSourceStore.getState().clear(), []);

  if (roomState.kind === "invalid") {
    return (
      <EntryLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Button onClick={() => navigate("/")}>Return home</Button>
        </div>
      </EntryLayout>
    );
  }
  if (recovering) {
    return null;
  }
  if (media === null) {
    return null;
  }
  const me: Member = {
    id: `${roomId}:host`,
    name: userName,
    role: "host",
    canControl: true,
    joinedAt: Date.now(),
  };

  return (
    <PlayerShell
      mode="host"
      media={media}
      metadata={handoff.metadata}
      me={me}
      roomId={roomId}
      file={handoff.file}
      membersStore={stores?.members}
      chatStore={stores?.chat}
      reactionStore={stores?.reaction}
      onExit={() => {
        socket?.leaveRoom();
        navigate("/");
      }}
    />
  );
}
