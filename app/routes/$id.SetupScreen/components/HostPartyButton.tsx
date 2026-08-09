import { Link, useParams } from "react-router";
import { useContext } from "react";
import UnifiedButton from "~/common/components/UnifiedButton";
import SessionContext from "../../../context/Session/logic/SessionContext";
import { resolveCanonicalRoomIdentity } from "~/features/room-join/model/room-identity.ts";

export default function HostPartyButton() {
  const { id } = useParams();
  const { roomId: sessionRoomId, updateRoomId } = useContext(SessionContext);
  const roomIdentity = resolveCanonicalRoomIdentity(id, sessionRoomId);
  const roomId = roomIdentity?.roomId ?? sessionRoomId;
  return (
    <Link
      to={`/${roomId}/file-upload`}
      onClick={() => {
        if (roomId) updateRoomId(roomId);
      }}
    >
      <UnifiedButton
        buttonLabel="Host party"
        classList="bg-red-700 shadow-red-700 text-white"
      >
      </UnifiedButton>
    </Link>
  );
}
