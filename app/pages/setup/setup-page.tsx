import { useContext } from "react";
import { useNavigate, useParams } from "react-router";
import SessionContext from "~/context/Session/logic/SessionContext.ts";
import {
  decideJoinPath,
  hostTarget,
  isHost,
  joinTarget,
} from "~/features/room-join/model/join-path.ts";
import JoinPartyButton from "~/features/room-join/ui/join-party-button.tsx";
import RoomCodeCopy from "~/features/room-join/ui/room-code-copy.tsx";
import NowShowingCard from "~/widgets/movie-now-showing/ui/now-showing-card.tsx";

export default function SetupPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { role, userName } = useContext(SessionContext);
  const roomId = id ?? "";

  const onJoin = () => {
    const decision = decideJoinPath(role, roomId, userName);
    if (decision) {
      navigate(decision.target);
      return;
    }
    navigate(isHost(role) ? hostTarget(roomId) : joinTarget(roomId));
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
        <JoinPartyButton label="Pick a video" onClick={onJoin} />
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-bg">
      <NowShowingCard onJoin={onJoin} />
    </main>
  );
}
