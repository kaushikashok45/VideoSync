import { assertEquals } from "@std/assert";
import { createServer } from "node:http";
import type { Server } from "node:http";
import express from "express";
import type { Express } from "express";
import { createLogger } from "../../shared/logger/logger.ts";
import { loadConfig } from "../../app/config.ts";
import type { AppConfig } from "../../app/config.ts";
import { MetadataHandler } from "./metadata-handler.ts";
import type { FetchLike } from "./metadata-handler.ts";
import type { AppErrorPayload } from "../../../shared/contracts/app-error-payload.ts";

const MOVIE = {
  title: "The Matrix",
  release_date: "1999-03-31",
  runtime: 136,
  overview: "A hacker learns the truth.",
  genres: [{ name: "Action" }, { name: "Sci-Fi" }],
  cast: [{ name: "Keanu Reeves" }, { name: "Carrie-Anne Moss" }],
  poster_path: "/p1.jpg",
  backdrop_path: "/b1.jpg",
  adult: false,
};

function config(over: Partial<AppConfig> = {}): AppConfig {
  return {
    ...loadConfig({}),
    metadataApiKey: "test-key",
    metadataTtlMs: 60_000,
    metadataRateLimit: 3,
    ...over,
  };
}

interface Harness {
  httpServer: Server;
  fetchCount: () => number;
  request: (path: string) => Promise<{ status: number; body: unknown }>;
  close: () => Promise<void>;
}

async function makeHarness(
  over: {
    fetchLike?: FetchLike;
    now?: () => number;
    cfg?: Partial<AppConfig>;
  } = {},
): Promise<Harness> {
  const app: Express = express();
  const httpServer = createServer(app);
  const inner = over.fetchLike ??
    (() =>
      Promise.resolve(
        new Response(JSON.stringify({ results: [MOVIE] }), { status: 200 }),
      ));
  let count = 0;
  const fetchLike: FetchLike = (url, init) => {
    count += 1;
    return inner(url, init);
  };
  new MetadataHandler({
    app,
    config: config(over.cfg),
    logger: createLogger({ level: "error", sink: () => {} }),
    fetchLike,
    now: over.now ?? (() => 0),
  }).attach();
  await new Promise<void>((r) => httpServer.listen(0, r));
  const addr = httpServer.address() as { port: number };
  const base = `http://localhost:${addr.port}`;
  async function request(path: string) {
    const res = await globalThis.fetch(`${base}${path}`);
    const body: unknown = await res.json();
    return { status: res.status, body };
  }
  async function close(): Promise<void> {
    await new Promise<void>((r) => httpServer.close(() => r()));
  }
  return { httpServer, fetchCount: () => count, request, close };
}

// Happy path
Deno.test("returns mapped MovieMetadata for a matched query", async () => {
  const h = await makeHarness();
  try {
    const res = await h.request("/api/metadata?q=matrix");
    assertEquals(res.status, 200);
    const meta = (res.body as { metadata: Record<string, unknown> }).metadata;
    assertEquals(meta.title, "The Matrix");
    assertEquals(meta.releaseYear, 1999);
    assertEquals(meta.runtime, 136);
    assertEquals(meta.genres, ["Action", "Sci-Fi"]);
    assertEquals(meta.posterUrl, "https://image.tmdb.org/t/p/w500/p1.jpg");
  } finally {
    await h.close();
  }
});

// Sad path
Deno.test("returns a 502 typed error when the metadata API rejects", async () => {
  const h = await makeHarness({
    fetchLike: () => Promise.reject(new Error("api down")),
  });
  try {
    const res = await h.request("/api/metadata?q=matrix");
    assertEquals(res.status, 502);
    const body = res.body as AppErrorPayload;
    assertEquals(body.code, "MEDIA_URL_UNPLAYABLE");
    assertEquals(body.detail?.stage, "metadata");
  } finally {
    await h.close();
  }
});

// Sad path
Deno.test("returns a 502 typed error when the metadata API is not ok", async () => {
  const h = await makeHarness({
    fetchLike: () => Promise.resolve(new Response("boom", { status: 500 })),
  });
  try {
    const res = await h.request("/api/metadata?q=matrix");
    assertEquals(res.status, 502);
    assertEquals((res.body as AppErrorPayload).code, "MEDIA_URL_UNPLAYABLE");
  } finally {
    await h.close();
  }
});

// Edge case
Deno.test("an empty results list yields metadata null with a 200", async () => {
  const h = await makeHarness({
    fetchLike: () =>
      Promise.resolve(
        new Response(JSON.stringify({ results: [] }), { status: 200 }),
      ),
  });
  try {
    const res = await h.request("/api/metadata?q=zzz");
    assertEquals(res.status, 200);
    assertEquals((res.body as { metadata: unknown }).metadata, null);
  } finally {
    await h.close();
  }
});

// Edge case
Deno.test("a missing query parameter returns a 400 typed error", async () => {
  const h = await makeHarness();
  try {
    const res = await h.request("/api/metadata");
    assertEquals(res.status, 400);
    assertEquals((res.body as AppErrorPayload).code, "MEDIA_URL_UNPLAYABLE");
  } finally {
    await h.close();
  }
});

// Edge case
Deno.test("a non-object API body yields metadata null, not a crash", async () => {
  const h = await makeHarness({
    fetchLike: () => Promise.resolve(new Response("42", { status: 200 })),
  });
  try {
    const res = await h.request("/api/metadata?q=x");
    assertEquals(res.status, 200);
    assertEquals((res.body as { metadata: unknown }).metadata, null);
  } finally {
    await h.close();
  }
});

// Mutation pin: normalizer is used on non-shape JSON
Deno.test("non-shape movie results yield metadata null, not a crash", async () => {
  const h = await makeHarness({
    fetchLike: () =>
      Promise.resolve(
        new Response(JSON.stringify({ results: [{ bogus: 1 }] }), {
          status: 200,
        }),
      ),
  });
  try {
    const res = await h.request("/api/metadata?q=x");
    assertEquals(res.status, 200);
    assertEquals((res.body as { metadata: unknown }).metadata, null);
  } finally {
    await h.close();
  }
});

// Mutation pin: cache reuse skips the network within the TTL
Deno.test("a second identical query within TTL does not refetch", async () => {
  const h = await makeHarness();
  try {
    await h.request("/api/metadata?q=matrix");
    await h.request("/api/metadata?q=matrix");
    assertEquals(h.fetchCount(), 1);
  } finally {
    await h.close();
  }
});

// Mutation pin: a cached no-match is reused too, not refetched
Deno.test("a cached no-match result is reused within the TTL", async () => {
  const h = await makeHarness({
    fetchLike: () =>
      Promise.resolve(
        new Response(JSON.stringify({ results: [] }), { status: 200 }),
      ),
  });
  try {
    await h.request("/api/metadata?q=zzz");
    await h.request("/api/metadata?q=zzz");
    assertEquals(h.fetchCount(), 1);
  } finally {
    await h.close();
  }
});

// Logical limits: rate limiting per IP
Deno.test("the N+1th request in the rate window is rejected with 429", async () => {
  const h = await makeHarness({ cfg: { metadataRateLimit: 2 } });
  try {
    assertEquals((await h.request("/api/metadata?q=a")).status, 200);
    assertEquals((await h.request("/api/metadata?q=b")).status, 200);
    const third = await h.request("/api/metadata?q=c");
    assertEquals(third.status, 429);
    assertEquals((third.body as AppErrorPayload).code, "SERVER_RATE_LIMITED");
  } finally {
    await h.close();
  }
});

// Logical limits: TTL expiry triggers a refetch
Deno.test("TTL expiry evicts the cache and refetches", async () => {
  let clock = 0;
  const h = await makeHarness({ now: () => clock });
  try {
    await h.request("/api/metadata?q=matrix");
    await h.request("/api/metadata?q=matrix");
    assertEquals(h.fetchCount(), 1);
    clock = 60_001;
    await h.request("/api/metadata?q=matrix");
    assertEquals(h.fetchCount(), 2);
  } finally {
    await h.close();
  }
});

// Logical limits: rate window resets after it elapses
Deno.test("the rate window resets once it elapses", async () => {
  let clock = 0;
  const h = await makeHarness({
    now: () => clock,
    cfg: { metadataRateLimit: 2 },
  });
  try {
    assertEquals((await h.request("/api/metadata?q=a")).status, 200);
    assertEquals((await h.request("/api/metadata?q=b")).status, 200);
    assertEquals((await h.request("/api/metadata?q=c")).status, 429);
    clock = 60_001;
    assertEquals((await h.request("/api/metadata?q=d")).status, 200);
  } finally {
    await h.close();
  }
});
