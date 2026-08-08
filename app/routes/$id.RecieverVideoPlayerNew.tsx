import { useContext } from "react";
import type { Member } from "contracts/member.ts";
import SessionContext from "../context/Session/logic/SessionContext";
import PlayerShell from "~/widgets/player-shell/ui/player-shell.tsx";

export default function RecieverVideoPlayerNew() {
  const { roomId, userName } = useContext(SessionContext);
  const me: Member = {
    id: `${roomId}:receiver`,
    name: userName,
    role: "viewer",
    canControl: false,
    joinedAt: Date.now(),
  };
  return <PlayerShell mode="receiver" media={{ mode: "upload" }} me={me} />;
}
