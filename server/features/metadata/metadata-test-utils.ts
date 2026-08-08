import { createServer } from "node:http";
import type { Server } from "node:http";
import express from "express";
import type { Express } from "express";
import { createLogger } from "../../shared/logger/logger.ts";
import { loadConfig } from "../../app/config.ts";
import type { AppConfig } from "../../app/config.ts";
import { MetadataHandler } from "./metadata-handler.ts";
import type { FetchLike } from "./metadata-handler.ts";

export const SEARCH_RESULT = {
  id: 603,
  title: "The Matrix",
  release_date: "1999-03-31",
  overview: "A hacker learns the truth about reality.",
  poster_path: "/p1.jpg",
  backdrop_path: "/b1.jpg",
  adult: false,
};

export const DETAIL_RESULT = {
  ...SEARCH_RESULT,
  runtime: 136,
  genres: [{ id: 28, name: "Action" }, { id: 878, name: "Sci-Fi" }],
  credits: { cast: [{ name: "Keanu Reeves" }, { name: "Carrie-Anne Moss" }] },
};

function tmdbMock(): FetchLike {
  return (url) => {
    const href = String(url);
    if (href.includes("/search/movie")) {
      return Promise.resolve(
        new Response(JSON.stringify({ results: [SEARCH_RESULT] }), {
          status: 200,
        }),
      );
    }
    if (href.includes("/movie/")) {
      return Promise.resolve(
        new Response(JSON.stringify(DETAIL_RESULT), { status: 200 }),
      );
    }
    return Promise.resolve(new Response("not found", { status: 404 }));
  };
}

export function config(over: Partial<AppConfig> = {}): AppConfig {
  return {
    ...loadConfig({}),
    metadataApiKey: "test-key",
    metadataTtlMs: 60_000,
    metadataRateLimit: 3,
    ...over,
  };
}

export interface Harness {
  httpServer: Server;
  fetchCount: () => number;
  request: (path: string) => Promise<{ status: number; body: unknown }>;
  close: () => Promise<void>;
}

export async function makeHarness(
  over: {
    fetchLike?: FetchLike;
    now?: () => number;
    cfg?: Partial<AppConfig>;
  } = {},
): Promise<Harness> {
  const app: Express = express();
  const httpServer = createServer(app);
  const inner = over.fetchLike ?? tmdbMock();
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
