import { useContext } from "react";
import { useNavigate, useParams } from "react-router";
import type { Member } from "contracts/member.ts";
import SessionContext from "../context/Session/logic/SessionContext";
import {
  useOptionalAppStores,
  useOptionalSocketClient,
} from "~/shared/api/socket-bridge.tsx";
import PlayerShell from "~/widgets/player-shell/ui/player-shell.tsx";

export default function RecieverVideoPlayerNew() {
  const { roomId: sessionRoomId, userName } = useContext(SessionContext);
  const { id } = useParams();
  const roomId = id ?? sessionRoomId;
  const navigate = useNavigate();
  const stores = useOptionalAppStores();
  const socket = useOptionalSocketClient();
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
      onExit={() => {
        socket?.leaveRoom();
        navigate("/");
      }}
    />
  );
}
