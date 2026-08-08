import { useContext } from "react";
import { useLocation } from "react-router";
import type { MediaSource } from "contracts/media-source.ts";
import type { Member } from "contracts/member.ts";
import SessionContext from "../context/Session/logic/SessionContext";
import PlayerShell from "~/widgets/player-shell/ui/player-shell.tsx";

export default function HostVideoPlayerNew() {
  const location = useLocation();
  const passedState = location.state as { videoURL?: string };
  const { roomId, userName } = useContext(SessionContext);
  const media: MediaSource = passedState?.videoURL
    ? { mode: "url", url: passedState.videoURL }
    : { mode: "upload" };
  const me: Member = {
    id: `${roomId}:host`,
    name: userName,
    role: "host",
    canControl: true,
    joinedAt: Date.now(),
  };
  return <PlayerShell mode="host" media={media} me={me} />;
}
