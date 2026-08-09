import { assert, assertEquals } from "@std/assert";
import type { MovieMetadata } from "contracts/movie-metadata.ts";
import type { SourceDecision } from "./source-resolver.ts";
import {
  buildHostRoute,
  resolveSource,
  UPLOAD_ERROR_NO_FILE,
  URL_ERROR_EMPTY,
  URL_ERROR_LOOKUP,
  URL_ERROR_PROTOCOL,
  URL_ERROR_SCHEME,
  validateUrl,
} from "./source-resolver.ts";

const ROOM_ID = "abc23";
const HOST_ROUTE = "/abc23/HostVideoPlayerNew";
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
const metadata = () => Promise.resolve(METADATA);
type FetchLike = (query: string) => Promise<MovieMetadata | null>;
const navigating = (
  d: SourceDecision,
): d is Extract<SourceDecision, { status: "navigating" }> =>
  d.status === "navigating";
const urlDecision = (url: string, fetchLike: FetchLike = metadata) =>
  resolveSource(
    { mode: "url", url, file: null },
    { roomId: ROOM_ID, fetchMetadataLike: fetchLike },
  );
const countingFetch = (
  count: { calls: number },
  result: () => Promise<MovieMetadata | null>,
): FetchLike =>
() => {
  count.calls += 1;
  return result();
};

// 1. Happy path
Deno.test("valid url: trims input, fetches metadata, navigates to the host route", async () => {
  const seen: string[] = [];
  const decision = await urlDecision(`  ${VALID_URL}  `, (query) => {
    seen.push(query);
    return metadata();
  });
  assertEquals(seen, [VALID_URL]);
  assert(navigating(decision));
  assertEquals(decision.route, HOST_ROUTE);
  assertEquals(decision.source, { mode: "url", url: VALID_URL });
  assertEquals(decision.metadata, METADATA);
});

Deno.test("no-match metadata does not block navigation (enrichment only)", async () => {
  const decision = await urlDecision(VALID_URL, () => Promise.resolve(null));
  assert(navigating(decision));
  assertEquals(decision.metadata, null);
});

Deno.test("upload with a file: navigates without waiting for metadata", async () => {
  const decision = await resolveSource(
    { mode: "upload", url: "", file: new File(["x"], "movie.mkv") },
    { roomId: ROOM_ID },
  );
  assert(navigating(decision));
  assertEquals(decision.route, HOST_ROUTE);
  assertEquals(decision.source, { mode: "upload" });
  assertEquals(decision.metadata, null);
});

// 2. Sad path
Deno.test("invalid protocol: inline error, no fetch, no navigation", async () => {
  const count = { calls: 0 };
  const decision = await urlDecision(
    "javascript:alert(1)",
    countingFetch(count, metadata),
  );
  assertEquals(decision, { status: "error", error: URL_ERROR_PROTOCOL });
  assertEquals(count.calls, 0);
});

Deno.test("upload without a file: error, no navigation", async () => {
  const decision = await resolveSource(
    { mode: "upload", url: "", file: null },
    { roomId: ROOM_ID },
  );
  assertEquals(decision, { status: "error", error: UPLOAD_ERROR_NO_FILE });
});
// 3. Edge cases
Deno.test("rejects empty, scheme-less, and odd-protocol urls; accepts web urls", () => {
  assertEquals(validateUrl(""), URL_ERROR_EMPTY);
  assertEquals(validateUrl("   "), URL_ERROR_EMPTY);
  assertEquals(validateUrl("example.com/movie"), URL_ERROR_SCHEME);
  assertEquals(validateUrl("www.example.com"), URL_ERROR_SCHEME);
  assertEquals(validateUrl("javascript:alert(1)"), URL_ERROR_PROTOCOL);
  assertEquals(validateUrl("ftp://example.com/movie"), URL_ERROR_PROTOCOL);
  assertEquals(validateUrl("data:text/plain,hi"), URL_ERROR_PROTOCOL);
  assertEquals(validateUrl(VALID_URL), null);
  assertEquals(validateUrl("http://example.com/movie"), null);
});
// 4. Mutation pins
Deno.test("buildHostRoute pins the exact legacy host route template", () => {
  assertEquals(buildHostRoute("abc23"), "/abc23/HostVideoPlayerNew");
  assertEquals(buildHostRoute(""), "//HostVideoPlayerNew");
});

Deno.test("dropping validation would fail: malformed url never navigates", async () => {
  const decision = await urlDecision("not a url at all");
  assertEquals(decision, { status: "error", error: URL_ERROR_SCHEME });
});

Deno.test("dropping the metadata call would fail for url mode", async () => {
  const count = { calls: 0 };
  await urlDecision(
    VALID_URL,
    countingFetch(count, () => Promise.resolve(null)),
  );
  assertEquals(count.calls, 1);
});
// 5. Logical limits
Deno.test("lookup failure is recoverable: retry re-fetches and can navigate", async () => {
  const count = { calls: 0 };
  const flaky: FetchLike = () => {
    count.calls += 1;
    return count.calls === 1 ? Promise.reject(new Error("down")) : metadata();
  };
  const first = await urlDecision(VALID_URL, flaky);
  assertEquals(first, { status: "error", error: URL_ERROR_LOOKUP });
  const retry = await urlDecision(VALID_URL, flaky);
  assertEquals(count.calls, 2);
  assert(navigating(retry));
});

Deno.test("very long valid urls are accepted without a length cap", async () => {
  const longUrl = `https://example.com/videos/${"a".repeat(1500)}`;
  const decision = await urlDecision(longUrl);
  assert(navigating(decision));
  assertEquals(decision.route, HOST_ROUTE);
});
