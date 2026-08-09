import { useContext, useState } from "react";
import { useNavigate } from "react-router";
import Role from "~/context/Session/contracts/Role.ts";
import SessionContext from "~/context/Session/logic/SessionContext.ts";
import JoinForm from "~/features/room-join/ui/join-form.tsx";
import {
  resetRoomScopedStores,
  useAppStores,
  useOptionalSocketClient,
} from "~/shared/api/socket-bridge.tsx";
import { Badge, Button } from "~/shared/ui-kit/index.ts";
import { writeHostSessionRoom } from "../logic/host-session-room.ts";
import { EntryLayout } from "./entry-layout.tsx";
import { MediaFrame } from "./media-frame.tsx";

export function LandingScreen() {
  const navigate = useNavigate();
  const socket = useOptionalSocketClient();
  const stores = useAppStores();
  const { updateRoomId, updateRole, updateUserName } = useContext(
    SessionContext,
  );
  const [pending, setPending] = useState(false);
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
    <EntryLayout>
      <div className="grid gap-xxl md:grid-cols-[minmax(0,1.25fr)_minmax(320px,400px)] md:items-start">
        <section className="flex flex-col gap-lg">
          <div className="flex flex-wrap items-center gap-sm">
            <Badge variant="brand">Watch together</Badge>
            <span className="font-mono text-sm text-ink-faint">
              No account needed
            </span>
          </div>
          <div className="flex flex-col gap-md">
            <h2 className="max-w-[13ch] text-4xl font-semibold leading-[1.08] text-ink text-balance md:text-6xl">
              Make distance feel like a shared couch.
            </h2>
            <p className="max-w-[58ch] text-base leading-relaxed text-ink-muted text-pretty">
              Start a private watch party with one room code. Everyone gets the
              same play, pause, and seek — so the movie stays the moment.
            </p>
          </div>
          <MediaFrame src={null} title="Tonight's feature">
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-md p-lg md:flex-row md:items-end md:justify-between md:p-xl">
              <div>
                <p className="text-xl font-semibold text-ink md:text-2xl">
                  Bring the film. We&apos;ll bring the room.
                </p>
              </div>
              <Button
                size="lg"
                loading={pending}
                onClick={() => void startWatching()}
                data-testid="start-watching"
              >
                Start a watch party
              </Button>
            </div>
          </MediaFrame>
          {error
            ? (
              <p role="alert" className="font-mono text-sm text-status-danger">
                {error}
              </p>
            )
            : null}
        </section>
        <section className="flex flex-col gap-lg border-t border-line-strong pt-lg md:mt-xxl md:pt-xl">
          <div className="flex flex-col gap-sm">
            <p className="font-mono text-sm font-semibold text-brand-text">
              Have an invite?
            </p>
            <h3 className="text-2xl font-semibold leading-tight text-ink text-balance">
              Join the room already in progress.
            </h3>
            <p className="text-base leading-relaxed text-ink-muted text-pretty">
              Enter your name and the host&apos;s code. You&apos;ll land in the
              same screening with the room context intact.
            </p>
          </div>
          <JoinForm />
        </section>
      </div>
    </EntryLayout>
  );
}
