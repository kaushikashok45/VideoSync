import { useNavigate } from "react-router";
import JoinForm from "~/features/room-join/ui/join-form.tsx";
import { Button } from "~/shared/ui-kit/index.ts";
import BackgroundAmbience from "~/widgets/brand-shell/ui/background-ambience.tsx";
import BrandMark from "~/widgets/brand-shell/ui/brand-mark.tsx";
import ThemeToggle from "~/widgets/brand-shell/ui/theme-toggle.tsx";

export default function HomePage() {
  const navigate = useNavigate();
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
      <Button variant="secondary" size="lg" onClick={() => navigate("/new")}>
        Start watching
      </Button>
    </div>
  );
}
