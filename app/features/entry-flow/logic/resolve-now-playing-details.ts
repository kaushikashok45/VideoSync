import type { MediaSource } from "contracts/media-source.ts";
import type { MovieMetadata } from "contracts/movie-metadata.ts";
import { formatRuntime } from "~/common/logic/format-runtime.ts";
import { deriveLocalTitle } from "./derive-local-title.ts";

export interface NowPlayingDetailsInput {
  source: MediaSource | null;
  fileName: string | null;
  metadata: MovieMetadata | null;
  durationSeconds: number | null;
}

export interface NowPlayingDetails {
  title: string;
  sourceLabel: string;
  durationLabel: string | null;
  artworkMode: "fallback" | "poster";
}

function artworkMode(metadata: MovieMetadata | null): "fallback" | "poster" {
  return metadata?.posterUrl ? "poster" : "fallback";
}

export function resolveNowPlayingDetails(
  input: NowPlayingDetailsInput,
): NowPlayingDetails {
  if (input.source === null) {
    return {
      title: "No video selected",
      sourceLabel: "Choose a source",
      durationLabel: null,
      artworkMode: "fallback",
    };
  }
  if (input.source.mode === "upload") {
    return {
      title: deriveLocalTitle(input.fileName),
      sourceLabel: "Local video",
      durationLabel: formatRuntime(input.durationSeconds),
      artworkMode: artworkMode(input.metadata),
    };
  }
  return {
    title: input.metadata?.title || "Video URL",
    sourceLabel: "Video URL",
    durationLabel: formatRuntime(input.durationSeconds),
    artworkMode: artworkMode(input.metadata),
  };
}
