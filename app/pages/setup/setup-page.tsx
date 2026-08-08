import { useContext } from "react";
import { useNavigate, useParams } from "react-router";
import SessionContext from "~/context/Session/logic/SessionContext.ts";
import {
  hostTarget,
  isHost,
  joinTarget,
} from "~/features/room-join/model/join-path.ts";
import JoinPartyButton from "~/features/room-join/ui/join-party-button.tsx";
import NowShowingCard from "~/widgets/movie-now-showing/ui/now-showing-card.tsx";

export default function SetupPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { role } = useContext(SessionContext);
  const roomId = id ?? "";

  if (isHost(role)) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-lg bg-bg px-md">
        <h1 className="font-script text-3xl text-ink">Host the party</h1>
        <p className="max-w-[40ch] text-center font-mono text-sm text-ink-muted">
          Your room code is{" "}
          {roomId}. Share it with friends, then pick a movie to start the watch
          party.
        </p>
        <JoinPartyButton
          label="Host the party"
          onClick={() => navigate(hostTarget(roomId))}
        />
      </main>
    );
  }

  return (
    <main className="relative min-h-screen bg-bg">
      <NowShowingCard onJoin={() => navigate(joinTarget(roomId))} />
    </main>
  );
}
