import { assertEquals } from "@std/assert";
import type { MovieMetadata } from "contracts/movie-metadata.ts";
import { lookupLocalMetadata } from "./lookup-local-metadata.ts";

const metadata: MovieMetadata = {
  title: "The Matrix",
  overview: "",
  posterUrl: "",
  backdropUrl: "",
  releaseYear: 1999,
  ageRating: "PG-13",
  runtime: 136,
  genres: [],
  cast: [],
};

Deno.test("looks up a decoded filename without its extension", async () => {
  const queries: string[] = [];
  const result = await lookupLocalMetadata(
    new File(["x"], "The%20Matrix.mkv"),
    (query) => {
      queries.push(query);
      return Promise.resolve(metadata);
    },
  );
  assertEquals(queries, ["The Matrix"]);
  assertEquals(result, metadata);
});

Deno.test("metadata lookup failure falls back to local playback", async () => {
  const result = await lookupLocalMetadata(
    new File(["x"], "movie.mp4"),
    () => Promise.reject(new Error("offline")),
  );
  assertEquals(result, null);
});

Deno.test("a missing metadata match is a valid enrichment result", async () => {
  const result = await lookupLocalMetadata(
    new File(["x"], "unknown.webm"),
    () => Promise.resolve(null),
  );
  assertEquals(result, null);
});
