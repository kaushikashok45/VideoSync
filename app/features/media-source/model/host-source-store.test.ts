import { assertEquals } from "@std/assert";
import type { MovieMetadata } from "contracts/movie-metadata.ts";
import { hostSourceStore } from "./host-source-store.ts";

const VALID_URL = "https://example.com/movie";
const METADATA: MovieMetadata = {
  title: "The Matrix",
  overview: "A hacker learns the truth.",
  posterUrl: "https://image.tmdb.org/t/p/w500/p1.jpg",
  backdropUrl: "https://image.tmdb.org/t/p/w1280/b1.jpg",
  releaseYear: 1999,
  ageRating: "PG-13",
  runtime: 136,
  genres: ["Action", "Sci-Fi"],
  cast: ["Keanu Reeves", "Carrie-Anne Moss"],
};

Deno.test("round-trips a committed url handoff", () => {
  hostSourceStore.getState().clear();
  hostSourceStore.getState().commit({
    source: { mode: "url", url: VALID_URL },
    file: null,
    metadata: METADATA,
  });
  const state = hostSourceStore.getState();
  assertEquals(state.source, { mode: "url", url: VALID_URL });
  assertEquals(state.file, null);
  assertEquals(state.metadata, METADATA);
});

Deno.test("clear resets the handoff to empty", () => {
  hostSourceStore.getState().clear();
  assertEquals(hostSourceStore.getState().source, null);
  assertEquals(hostSourceStore.getState().file, null);
  assertEquals(hostSourceStore.getState().metadata, null);
});

Deno.test("commits an upload source carrying the file reference", () => {
  hostSourceStore.getState().clear();
  const file = new File(["x"], "movie.mkv");
  hostSourceStore.getState().commit({
    source: { mode: "upload" },
    file,
    metadata: null,
  });
  assertEquals(hostSourceStore.getState().source, { mode: "upload" });
  assertEquals(hostSourceStore.getState().file, file);
});
