import type { MovieMetadata } from "contracts/movie-metadata.ts";
import { formatRuntime } from "~/common/logic/format-runtime.ts";
import {
  Avatar,
  Badge,
  Button,
  EmptyState,
  useReveal,
} from "~/shared/ui-kit/index.ts";
import Backdrop from "./backdrop.tsx";
import Poster from "./poster.tsx";

export interface NowShowingCardProps {
  metadata?: MovieMetadata;
  onJoin: () => void;
}

function JoinButton({ onJoin }: { onJoin: () => void }) {
  return (
    <Button data-testid="join-button" size="lg" onClick={onJoin}>
      Join the watch party
    </Button>
  );
}

function JoinEmptyState({ onJoin }: { onJoin: () => void }) {
  return (
    <div className="flex flex-col items-center gap-lg py-xxl">
      <EmptyState
        title="This watch party has no poster yet"
        description="The host has not picked a movie yet. You can join and wait for the show."
        action={<JoinButton onJoin={onJoin} />}
      />
    </div>
  );
}

export default function NowShowingCard({
  metadata,
  onJoin,
}: NowShowingCardProps) {
  const posterReveal = useReveal({ delayMs: 100, durationMs: 400 });
  const contentReveal = useReveal({ delayMs: 200, durationMs: 400 });
  const actionReveal = useReveal({ delayMs: 300, durationMs: 400 });
  if (metadata === undefined) {
    return <JoinEmptyState onJoin={onJoin} />;
  }
  return (
    <section className="relative isolate flex flex-col gap-lg">
      <Backdrop backdropUrl={metadata.backdropUrl} />
      <div className="relative z-10 flex flex-col gap-md px-md py-lg md:flex-row md:gap-xl md:px-lg md:py-xxl">
        <div
          className="animate-fade-up motion-reduce:animate-none"
          style={posterReveal.style}
        >
          <Poster posterUrl={metadata.posterUrl} title={metadata.title} />
        </div>
        <div
          className="flex animate-fade-up flex-col gap-md motion-reduce:animate-none"
          style={contentReveal.style}
        >
          <header className="flex flex-col gap-sm">
            <h1 className="text-3xl font-semibold text-ink md:text-4xl">
              {metadata.title}
            </h1>
            <div className="flex flex-wrap items-center gap-sm">
              <Badge>{metadata.ageRating}</Badge>
              <span className="font-mono text-sm text-ink-muted">
                {metadata.releaseYear}
              </span>
              <span className="font-mono text-sm text-ink-muted">
                {formatRuntime(metadata.runtime * 60)}
              </span>
            </div>
          </header>
          {metadata.genres.length > 0
            ? (
              <ul
                data-testid="genre-chips"
                className="flex flex-wrap gap-xs"
              >
                {metadata.genres.map((genre) => (
                  <li
                    key={genre}
                    className="rounded-full bg-surface-raised px-sm py-xxs font-mono text-xs text-ink-muted"
                  >
                    {genre}
                  </li>
                ))}
              </ul>
            )
            : null}
          {metadata.cast.length > 0
            ? (
              <ul
                data-testid="cast-chips"
                className="flex flex-wrap items-center gap-sm"
              >
                {metadata.cast.map((member) => (
                  <li
                    key={member}
                    data-testid="cast-chip"
                    aria-label={member}
                    className="flex items-center gap-xs"
                  >
                    <Avatar name={member} size="sm" />
                  </li>
                ))}
              </ul>
            )
            : null}
          <p className="line-clamp-3 text-sm leading-relaxed text-ink-muted text-pretty">
            {metadata.overview}
          </p>
          <div
            className="animate-fade-up motion-reduce:animate-none"
            style={actionReveal.style}
          >
            <JoinButton onJoin={onJoin} />
          </div>
        </div>
      </div>
    </section>
  );
}
