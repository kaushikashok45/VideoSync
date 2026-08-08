import { useContext } from "react";
import type { Member } from "contracts/member.ts";
import SessionContext from "../context/Session/logic/SessionContext";
import { useOptionalAppStores } from "~/shared/api/socket-bridge.tsx";
import PlayerShell from "~/widgets/player-shell/ui/player-shell.tsx";

export default function RecieverVideoPlayerNew() {
  const { roomId, userName } = useContext(SessionContext);
  const stores = useOptionalAppStores();
  const me: Member = {
    id: `${roomId}:receiver`,
    name: userName,
    role: "viewer",
    canControl: false,
    joinedAt: Date.now(),
  };
  return (
    <PlayerShell
      mode="receiver"
      media={{ mode: "upload" }}
      me={me}
      roomId={roomId}
      membersStore={stores?.members}
      chatStore={stores?.chat}
      reactionStore={stores?.reaction}
    />
  );
}
