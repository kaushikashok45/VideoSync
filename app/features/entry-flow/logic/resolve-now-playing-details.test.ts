import { assertEquals } from "@std/assert";
import type { MovieMetadata } from "contracts/movie-metadata.ts";
import { resolveNowPlayingDetails } from "./resolve-now-playing-details.ts";

const METADATA: MovieMetadata = {
  title: "The Matrix",
  overview: "A hacker learns the truth.",
  posterUrl: "https://image.tmdb.org/t/p/w500/p1.jpg",
  backdropUrl: "https://image.tmdb.org/t/p/w1280/b1.jpg",
  releaseYear: 1999,
  ageRating: "PG-13",
  runtime: 136,
  genres: ["Action", "Sci-Fi"],
  cast: ["Keanu Reeves"],
};

Deno.test("resolveNowPlayingDetails derives a local title from the filename", () => {
  assertEquals(
    resolveNowPlayingDetails({
      source: { mode: "upload" },
      fileName: "  My%20Movie.Final.mp4 ",
      metadata: null,
      durationSeconds: null,
    }),
    {
      title: "My Movie.Final",
      sourceLabel: "Local video",
      durationLabel: null,
      artworkMode: "fallback",
    },
  );
});

Deno.test("resolveNowPlayingDetails falls back to Local video when the filename is empty", () => {
  assertEquals(
    resolveNowPlayingDetails({
      source: { mode: "upload" },
      fileName: "   .mp4   ",
      metadata: null,
      durationSeconds: 0,
    }),
    {
      title: "Local video",
      sourceLabel: "Local video",
      durationLabel: "0 mins",
      artworkMode: "fallback",
    },
  );
});

Deno.test("resolveNowPlayingDetails tolerates raw percent signs in filenames", () => {
  assertEquals(
    resolveNowPlayingDetails({
      source: { mode: "upload" },
      fileName: "100% Real.mp4",
      metadata: null,
      durationSeconds: null,
    }),
    {
      title: "100% Real",
      sourceLabel: "Local video",
      durationLabel: null,
      artworkMode: "fallback",
    },
  );
});

Deno.test("resolveNowPlayingDetails uses remote metadata for url sources", () => {
  assertEquals(
    resolveNowPlayingDetails({
      source: { mode: "url", url: "https://example.com/movie" },
      fileName: null,
      metadata: METADATA,
      durationSeconds: 3671,
    }),
    {
      title: "The Matrix",
      sourceLabel: "Video URL",
      durationLabel: "1 hr 1 min",
      artworkMode: "poster",
    },
  );
});

Deno.test("resolveNowPlayingDetails stays stable when no source is ready", () => {
  assertEquals(
    resolveNowPlayingDetails({
      source: null,
      fileName: null,
      metadata: null,
      durationSeconds: Number.NaN,
    }),
    {
      title: "No video selected",
      sourceLabel: "Choose a source",
      durationLabel: null,
      artworkMode: "fallback",
    },
  );
});
