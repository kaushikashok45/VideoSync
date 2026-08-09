import type { MovieMetadata } from "contracts/movie-metadata.ts";
import { Badge, Button } from "~/shared/ui-kit/index.ts";
import type { NowPlayingDetails } from "../logic/resolve-now-playing-details.ts";

export interface NowPlayingCardProps {
  details: NowPlayingDetails;
  metadata: MovieMetadata | null;
  onReplace?: () => void;
}

export function NowPlayingCard(
  { details, metadata, onReplace }: NowPlayingCardProps,
) {
  return (
    <section className="flex flex-col gap-md rounded-[20px] border border-line bg-surface p-lg">
      <div className="flex flex-wrap items-center gap-sm">
        <Badge variant="brand">{details.sourceLabel}</Badge>
        {details.durationLabel ? <Badge>{details.durationLabel}</Badge> : null}
        {metadata?.releaseYear ? <Badge>{metadata.releaseYear}</Badge> : null}
      </div>
      <div className="flex flex-col gap-xs">
        <h2 className="text-2xl font-semibold text-ink text-balance md:text-3xl">
          {details.title}
        </h2>
        <p className="font-mono text-sm text-ink-muted text-pretty">
          {metadata?.overview ||
            "Your room preview stays stable while the source metadata catches up."}
        </p>
      </div>
      {onReplace
        ? (
          <div className="pt-xs">
            <Button variant="secondary" size="sm" onClick={onReplace}>
              Replace source
            </Button>
          </div>
        )
        : null}
    </section>
  );
}
