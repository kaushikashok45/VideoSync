import { useContext } from "react";
import { useLocation } from "react-router";
import type { MediaSource } from "contracts/media-source.ts";
import type { Member } from "contracts/member.ts";
import SessionContext from "../context/Session/logic/SessionContext";
import { hostSourceStore } from "~/features/media-source/model/host-source-store.ts";
import { useOptionalAppStores } from "~/shared/api/socket-bridge.tsx";
import PlayerShell from "~/widgets/player-shell/ui/player-shell.tsx";

export default function HostVideoPlayerNew() {
  const location = useLocation();
  const passedState = location.state as { videoURL?: string };
  const handoff = hostSourceStore.getState();
  const stores = useOptionalAppStores();
  const { roomId, userName } = useContext(SessionContext);
  const media: MediaSource = handoff.source ??
    (passedState?.videoURL
      ? { mode: "url", url: passedState.videoURL }
      : { mode: "upload" });
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
    />
  );
}
