import { Link, useParams } from "react-router";
import { useContext } from "react";
import UnifiedButton from "~/common/components/UnifiedButton";
import SessionContext from "../../../context/Session/logic/SessionContext";
import { resolveCanonicalRoomIdentity } from "~/features/room-join/model/room-identity.ts";

export default function HostPartyButton() {
  const { id } = useParams();
  const { roomId: sessionRoomId, updateRoomId } = useContext(SessionContext);
  const roomIdentity = resolveCanonicalRoomIdentity(id, sessionRoomId);
  const inferredRoomId = roomIdentity?.roomId ?? sessionRoomId;

  return (
    <Link
      to={`/${inferredRoomId}/RecieverVideoPlayerNew`}
      onClick={() => {
        if (inferredRoomId) updateRoomId(inferredRoomId);
      }}
    >
      <UnifiedButton
        buttonLabel="Join party"
        classList="bg-blue-700 shadow-blue-700 text-white"
      >
      </UnifiedButton>
    </Link>
  );
}
