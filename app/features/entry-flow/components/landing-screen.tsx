import { useContext, useState } from "react";
import { Menu } from "lucide-react";
import { useNavigate } from "react-router";
import Role from "~/context/Session/contracts/Role.ts";
import SessionContext from "~/context/Session/logic/SessionContext.ts";
import JoinForm from "~/features/room-join/ui/join-form.tsx";
import {
  resetRoomScopedStores,
  useAppStores,
  useOptionalSocketClient,
} from "~/shared/api/socket-bridge.tsx";
import { Button, Popover } from "~/shared/ui-kit/index.ts";
import { writeHostSessionRoom } from "../logic/host-session-room.ts";
import { EntryLayout } from "./entry-layout.tsx";
import { LandingFooter } from "./landing-footer.tsx";
import { LandingInfo } from "./landing-info.tsx";
import { LandingPosterWall } from "./landing-poster-wall.tsx";

function LandingNavigation() {
  return (
    <Popover
      className="landing-nav-popover w-56"
      trigger={
        <button
          type="button"
          aria-label="Open navigation"
          className="grid min-h-11 min-w-11 place-items-center rounded-md border border-line bg-surface text-ink hover:bg-surface-raised"
        >
          <Menu size={18} aria-hidden="true" />
        </button>
      }
    >
      <nav aria-label="Site navigation" className="flex flex-col gap-xs">
        <a
          className="rounded-sm px-sm py-xs text-sm text-ink-muted hover:bg-brand-soft hover:text-brand-text"
          href="#about"
        >
          About
        </a>
        <a
          className="rounded-sm px-sm py-xs text-sm text-ink-muted hover:bg-brand-soft hover:text-brand-text"
          href="#help"
        >
          Help
        </a>
      </nav>
    </Popover>
  );
}

export function LandingScreen() {
  const navigate = useNavigate();
  const socket = useOptionalSocketClient();
  const stores = useAppStores();
  const { updateRoomId, updateRole, updateUserName } = useContext(
    SessionContext,
  );
  const [pending, setPending] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startWatching = async () => {
    setPending(true);
    setError(null);
    if (!socket) {
      setError("The room service is still starting. Try again in a moment.");
      setPending(false);
      return;
    }
    try {
      const hostName = "Host";
      const room = await socket.createRoom(hostName);
      resetRoomScopedStores(stores);
      stores.room.getState().setRoom(room);
      writeHostSessionRoom(room.code);
      updateRoomId(room.code);
      updateRole(Role.HOST);
      updateUserName(hostName);
      navigate(`/${room.code}/SetupScreen`);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not start the room.",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <EntryLayout headerActions={<LandingNavigation />}>
      <section className="landing-hero mx-auto w-full max-w-6xl">
        <LandingPosterWall />
        <div className="landing-hero-content">
          <p className="font-mono text-sm font-semibold text-brand-text">
            The film is only half the night
          </p>
          <h2 className="landing-hero-title landing-stage-ink text-4xl font-semibold leading-[1.04] text-balance md:text-6xl">
            Make room for everyone.
          </h2>
          <p className="landing-stage-muted max-w-[48ch] text-base leading-relaxed text-pretty">
            One link brings the room together. Reactions, chat, and playback
            stay with the picture.
          </p>
          <div className="flex flex-wrap items-center gap-sm pt-sm">
            <Button
              size="lg"
              loading={pending}
              onClick={() => void startWatching()}
              data-testid="start-watching"
            >
              Start a watch party
            </Button>
            <span className="landing-private-meta landing-stage-muted font-mono text-sm">
              Private room · up to 15 people
            </span>
          </div>
          <div className="landing-avatars" aria-hidden="true">
            <span>A</span>
            <span>J</span>
            <span>M</span>
            <span>+</span>
          </div>
        </div>
        <p className="landing-hero-note landing-stage-muted font-mono text-xs">
          SYNC PARTY / YOUR SCREENING ROOM
        </p>
        <div className="landing-join-row flex flex-col gap-sm md:flex-row md:items-center md:justify-between">
          {error
            ? (
              <p role="alert" className="font-mono text-sm text-status-danger">
                {error}
              </p>
            )
            : (
              <span className="landing-stage-muted text-sm">
                Ready when you are.
              </span>
            )}
          <div className="flex flex-col items-start gap-xs md:items-end">
            <button
              type="button"
              data-testid="reveal-join"
              aria-expanded={joinOpen}
              aria-controls="join-form"
              onClick={() => setJoinOpen((current) => !current)}
              className="font-built text-sm font-semibold text-brand-text underline-offset-4 hover:underline"
            >
              {joinOpen ? "Hide join form" : "Join with a room code"}
            </button>
            {joinOpen ? <JoinForm /> : null}
          </div>
        </div>
      </section>
      <LandingInfo />
      <LandingFooter />
    </EntryLayout>
  );
}
