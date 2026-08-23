import type { ReactNode } from "react";
import { Button, Modal } from "~/shared/ui-kit/index.ts";

type HeroProps = {
  pending: boolean;
  joinOpen: boolean;
  error: string | null;
  onStartWatching: () => void;
  onToggleJoin: () => void;
};

function HeroBadge() {
  return (
    <span className="landing-badge">
      <b>New</b>
      Watch parties, without the group chat chaos
    </span>
  );
}

type HeroCtaProps = Pick<
  HeroProps,
  "pending" | "onStartWatching" | "onToggleJoin"
>;

function HeroCtaRow(
  { pending, onStartWatching, onToggleJoin }: HeroCtaProps,
) {
  return (
    <div className="flex flex-wrap items-center gap-sm">
      <Button onClick={onStartWatching} disabled={pending}>
        {pending ? "Starting..." : "Start a room →"}
      </Button>
      <Button
        variant="secondary"
        type="button"
        data-testid="reveal-join"
        aria-haspopup="dialog"
        onClick={onToggleJoin}
      >
        I have a room code
      </Button>
    </div>
  );
}

function HeroActions(
  props: HeroCtaProps & Pick<HeroProps, "error">,
) {
  return (
    <div className="landing-hero-aside">
      <p>
        Queue anything, sync every frame, and actually see your friends'
        reactions land in real time.
      </p>
      <HeroCtaRow {...props} />
      {props.error && (
        <p role="alert" className="mt-sm text-sm text-status-danger">
          {props.error}
        </p>
      )}
    </div>
  );
}

function HeroShot() {
  return (
    <div className="landing-hero-shot">
      <div className="landing-hero-shot-bar" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
      <img
        className="landing-hero-shot-img"
        src="https://placehold.co/1200x740/0a0a0a/a1a1a1?text=Room+preview&font=roboto"
        width={1200}
        height={740}
        loading="eager"
        alt="Preview of a Sync Party room with synced playback and friends' reactions"
      />
    </div>
  );
}

export function LandingHero(
  { children, joinOpen, ...actions }: HeroProps & { children: ReactNode },
) {
  return (
    <section className="landing-hero">
      <HeroBadge />
      <div className="landing-hero-row">
        <h1 className="landing-hero-title">Same couch, different cities.</h1>
        <HeroActions {...actions} />
      </div>
      <HeroShot />
      <Modal open={joinOpen} title="Join a room" onClose={actions.onToggleJoin}>
        {children}
      </Modal>
    </section>
  );
}
