import { useContext, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import SessionContext from "~/context/Session/logic/SessionContext.ts";
import { useAppStores, useSocketClient } from "~/shared/api/socket-bridge.tsx";
import { isHost } from "~/features/room-join/model/join-path.ts";
import { resolveCanonicalRoomIdentity } from "~/features/room-join/model/room-identity.ts";
import JoinPartyButton from "~/features/room-join/ui/join-party-button.tsx";
import RoomCodeCopy from "~/features/room-join/ui/room-code-copy.tsx";
import NowShowingCard from "~/widgets/movie-now-showing/ui/now-showing-card.tsx";

export default function SetupPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { role, roomId: sessionRoomId, updateRoomId, userName } = useContext(
    SessionContext,
  );
  const socket = useSocketClient();
  const stores = useAppStores();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const roomIdentity = resolveCanonicalRoomIdentity(id, sessionRoomId);
  const roomId = roomIdentity?.roomId ?? "";

  useEffect(() => {
    if (roomIdentity === null) return;
    if (sessionRoomId === roomIdentity.roomId) return;
    updateRoomId(roomIdentity.roomId);
  }, [roomIdentity, sessionRoomId, updateRoomId]);

  const onJoin = async () => {
    setPending(true);
    setError(null);
    try {
      const payload = isHost(role)
        ? { room: await socket.createRoom(userName || "Host") }
        : await socket.joinRoom(roomId, userName);
      stores.room.getState().setRoom(payload.room);
      if ("members" in payload) {
        stores.members.getState().setMembers(
          payload.members,
          socket.getSocketId() ?? "",
        );
      }
      const targetRoomId = payload.room.code;
      navigate(
        isHost(role)
          ? `/${targetRoomId}/file-upload`
          : `/${targetRoomId}/RecieverVideoPlayerNew`,
      );
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not join the party.",
      );
    } finally {
      setPending(false);
    }
  };

  if (isHost(role)) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-xl bg-bg px-md py-xxl">
        <h1 className="font-script text-3xl text-ink md:text-4xl">
          Host the party
        </h1>
        <p className="max-w-[50ch] text-center font-mono text-sm text-ink-muted">
          Share your room code so friends can join, then pick a video to start
          the show.
        </p>
        <RoomCodeCopy code={roomId} />
        <JoinPartyButton
          label="Pick a video"
          onClick={onJoin}
          loading={pending}
        />
        {error
          ? (
            <p role="alert" className="font-mono text-sm text-status-danger">
              {error}
            </p>
          )
          : null}
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-bg">
      <NowShowingCard onJoin={onJoin} />
    </main>
  );
}
