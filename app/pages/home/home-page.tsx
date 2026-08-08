import { useContext } from "react";
import { useNavigate } from "react-router";
import Role from "~/context/Session/contracts/Role.ts";
import SessionContext from "~/context/Session/logic/SessionContext.ts";
import { generateRoomCode } from "~/features/room-join/model/join-behaviour.ts";
import JoinForm from "~/features/room-join/ui/join-form.tsx";
import { Button } from "~/shared/ui-kit/index.ts";
import BackgroundAmbience from "~/widgets/brand-shell/ui/background-ambience.tsx";
import BrandMark from "~/widgets/brand-shell/ui/brand-mark.tsx";
import ThemeToggle from "~/widgets/brand-shell/ui/theme-toggle.tsx";

export default function HomePage() {
  const navigate = useNavigate();
  const { updateRoomId, updateRole } = useContext(SessionContext);

  const startWatching = () => {
    const code = generateRoomCode();
    updateRoomId(code);
    updateRole(Role.HOST);
    navigate(`/${code}/SetupScreen`);
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-xl overflow-hidden px-md py-xxl">
      <div className="absolute right-md top-md z-10">
        <ThemeToggle />
      </div>
      <BackgroundAmbience />
      <div className="flex animate-fade-up flex-col items-center gap-lg motion-reduce:animate-none">
        <BrandMark />
        <p className="font-mono text-ink-muted">Watch together, right now.</p>
      </div>
      <div className="grid w-full max-w-4xl gap-lg md:grid-cols-2 md:gap-xl">
        <section className="flex flex-col gap-lg rounded-lg border border-brand-text/20 bg-brand-soft p-lg md:p-xl">
          <div className="flex flex-col gap-xs">
            <h2 className="font-mono text-sm font-bold text-ink">
              Host a party
            </h2>
            <p className="font-mono text-sm text-ink-muted">
              Pick a video or a link, share your code, and everyone watches in
              lock-step.
            </p>
          </div>
          <Button
            variant="primary"
            size="lg"
            onClick={startWatching}
            data-testid="start-watching"
            className="w-full md:w-auto"
          >
            Host a party
          </Button>
        </section>
        <section className="flex flex-col gap-lg rounded-lg border border-line bg-surface-raised p-lg md:p-xl">
          <div className="flex flex-col gap-xs">
            <h2 className="font-mono text-sm font-bold text-ink">
              Join a party
            </h2>
            <p className="font-mono text-sm text-ink-muted">
              Enter the code your host shared to sync in.
            </p>
          </div>
          <JoinForm />
        </section>
      </div>
    </div>
  );
}
