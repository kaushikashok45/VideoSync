import { assertEquals } from "@std/assert";
import { MetadataCache } from "./metadata-cache.ts";
import type { MovieMetadata } from "../../../shared/contracts/movie-metadata.ts";

const META: MovieMetadata = {
  title: "The Matrix",
  overview: "",
  posterUrl: "",
  backdropUrl: "",
  releaseYear: 1999,
  ageRating: "PG-13",
  runtime: 136,
  genres: ["Action"],
  cast: [],
};

// Happy path
Deno.test("set stores a value and get returns it within the TTL", () => {
  const clock = 0;
  const cache = new MetadataCache<MovieMetadata>({
    ttlMs: 1000,
    now: () => clock,
  });
  cache.set("matrix", META);
  assertEquals(cache.get("matrix"), META);
});

// Happy path
Deno.test("get returns undefined for a never-set key", () => {
  const cache = new MetadataCache<MovieMetadata>({ ttlMs: 1000 });
  assertEquals(cache.get("missing"), undefined);
});

// Sad path
Deno.test("get returns undefined once the TTL has passed", () => {
  let clock = 0;
  const cache = new MetadataCache<MovieMetadata>({
    ttlMs: 1000,
    now: () => clock,
  });
  cache.set("matrix", META);
  clock = 1001;
  assertEquals(cache.get("matrix"), undefined);
});

// Edge cases
Deno.test("exactly-at the expiry boundary is a miss, just-before is a hit", () => {
  let clock = 0;
  const cache = new MetadataCache<MovieMetadata>({
    ttlMs: 1000,
    now: () => clock,
  });
  cache.set("matrix", META);
  clock = 999;
  assertEquals(cache.get("matrix"), META);
  clock = 1000;
  assertEquals(cache.get("matrix"), undefined);
});

// Mutation pins
Deno.test("different keys never collide", () => {
  const clock = 0;
  const cache = new MetadataCache<MovieMetadata>({
    ttlMs: 1000,
    now: () => clock,
  });
  cache.set("matrix", META);
  cache.set("inception", { ...META, title: "Inception" });
  assertEquals(cache.get("matrix")?.title, "The Matrix");
  assertEquals(cache.get("inception")?.title, "Inception");
});

Deno.test("set overwrites an existing value for the same key", () => {
  const cache = new MetadataCache<MovieMetadata>({ ttlMs: 1000 });
  cache.set("matrix", META);
  cache.set("matrix", { ...META, title: "Matrix Reloaded" });
  assertEquals(cache.get("matrix")?.title, "Matrix Reloaded");
});

// Logical limits
Deno.test("an expired entry is evicted and later reads miss", () => {
  let clock = 0;
  const cache = new MetadataCache<MovieMetadata>({
    ttlMs: 500,
    now: () => clock,
  });
  cache.set("matrix", META);
  clock = 600;
  assertEquals(cache.get("matrix"), undefined);
  assertEquals(cache.get("matrix"), undefined);
});

Deno.test("re-setting after expiry restores a live entry", () => {
  let clock = 0;
  const cache = new MetadataCache<MovieMetadata>({
    ttlMs: 500,
    now: () => clock,
  });
  cache.set("matrix", META);
  clock = 600;
  cache.set("matrix", META);
  assertEquals(cache.get("matrix"), META);
});
