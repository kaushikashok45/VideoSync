import { Button } from "~/shared/ui-kit/index.ts";

type LandingCtaProps = {
  pending: boolean;
  onStartWatching: () => void;
};

export function LandingCta({ pending, onStartWatching }: LandingCtaProps) {
  return (
    <section className="landing-cta" aria-labelledby="cta-heading">
      <h2 id="cta-heading">Same couch, different cities — tonight.</h2>
      <p>
        No accounts, no setup screens. Start a room and send the link to the
        first person you want next to you.
      </p>
      <div className="landing-cta-actions">
        <Button onClick={onStartWatching} disabled={pending}>
          {pending ? "Starting..." : "Start a room →"}
        </Button>
      </div>
    </section>
  );
}
