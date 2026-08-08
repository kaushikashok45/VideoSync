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
    <div className="relative flex min-h-screen flex-col items-center justify-center gap-lg overflow-hidden px-md py-xxl">
      <div className="absolute right-md top-md z-10">
        <ThemeToggle />
      </div>
      <BackgroundAmbience />
      <div className="flex animate-fade-up flex-col items-center gap-lg motion-reduce:animate-none">
        <BrandMark />
        <p className="font-mono text-ink-muted">Watch together, right now.</p>
      </div>
      <JoinForm />
      <Button
        variant="secondary"
        size="lg"
        onClick={startWatching}
        data-testid="start-watching"
      >
        Start watching
      </Button>
    </div>
  );
}
