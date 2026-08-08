import { assertEquals, assertRejects } from "@std/assert";
import { fetchMetadata } from "./metadata-client.ts";
import { AppError } from "contracts/app-error.ts";
import type { MovieMetadata } from "contracts/movie-metadata.ts";

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

function okResponse(metadata: MovieMetadata | null): Response {
  return new Response(JSON.stringify({ metadata }), { status: 200 });
}

// Happy path
Deno.test("returns MovieMetadata from a 2xx response", async () => {
  const fetchLike = () => Promise.resolve(okResponse(METADATA));
  const result = await fetchMetadata("matrix", { fetchLike });
  assertEquals(result?.title, "The Matrix");
  assertEquals(result?.releaseYear, 1999);
  assertEquals(result?.genres, ["Action", "Sci-Fi"]);
});

// Sad path
Deno.test("throws MEDIA_URL_UNPLAYABLE on a non-2xx response", async () => {
  const fetchLike = () =>
    Promise.resolve(new Response("nope", { status: 500 }));
  await assertRejects(
    () => fetchMetadata("matrix", { fetchLike }),
    AppError,
    "play",
  );
});

// Sad path
Deno.test("throws MEDIA_URL_UNPLAYABLE when the network rejects", async () => {
  const fetchLike = () => Promise.reject(new TypeError("network down"));
  await assertRejects(
    () => fetchMetadata("matrix", { fetchLike }),
    AppError,
    "play",
  );
});

// Edge case
Deno.test("returns null when the server reports no match", async () => {
  const fetchLike = () => Promise.resolve(okResponse(null));
  assertEquals(await fetchMetadata("zzz", { fetchLike }), null);
});

// Mutation pin: response shape must carry the metadata key
Deno.test("throws when the response omits the metadata key", async () => {
  const fetchLike = () =>
    Promise.resolve(
      new Response(JSON.stringify({ results: [] }), { status: 200 }),
    );
  await assertRejects(
    () => fetchMetadata("matrix", { fetchLike }),
    AppError,
  );
});

// Logical limits: query is url-encoded on the wire
Deno.test("url-encodes the query parameter", async () => {
  let seen = "";
  const fetchLike = (url: string | URL | Request) => {
    seen = String(url);
    return Promise.resolve(okResponse(METADATA));
  };
  await fetchMetadata("the matrix", { fetchLike });
  assertEquals(seen, "/api/metadata?q=the%20matrix");
});
