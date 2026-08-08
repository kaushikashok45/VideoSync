import type express from "express";
import { AppError } from "../../../shared/contracts/app-error.ts";
import type { MetadataPayload } from "../../../shared/contracts/payloads/metadata-payload.ts";
import type { MovieMetadata } from "../../../shared/contracts/movie-metadata.ts";
import type { AppConfig } from "../../app/config.ts";
import type { Logger } from "../../shared/logger/logger.ts";
import { MetadataCache } from "./metadata-cache.ts";
import { normalizeMovie } from "./metadata-normalizer.ts";

export type FetchLike = (
  url: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export interface MetadataHandlerDeps {
  app: express.Express;
  config: AppConfig;
  logger: Logger;
  fetchLike?: FetchLike;
  now?: () => number;
}

const SEARCH_URL = "https://api.themoviedb.org/3/search/movie";
const RATE_WINDOW_MS = 60_000;

interface RateEntry {
  count: number;
  startedAt: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export class MetadataHandler {
  private cache: MetadataCache<MovieMetadata | null>;
  private rate = new Map<string, RateEntry>();

  constructor(private deps: MetadataHandlerDeps) {
    this.cache = new MetadataCache<MovieMetadata | null>({
      ttlMs: this.deps.config.metadataTtlMs,
      now: this.deps.now ?? Date.now,
    });
  }

  attach(): void {
    this.deps.app.get("/api/metadata", (req, res) => void this.onGet(req, res));
  }

  private async onGet(
    req: express.Request,
    res: express.Response,
  ): Promise<void> {
    const query = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (query === "") {
      this.typed(res, 400, this.error("missing-query"));
      return;
    }
    const ip = String(req.ip ?? "unknown");
    if (!this.rateLimit(ip)) {
      this.typed(res, 429, new AppError("SERVER_RATE_LIMITED"));
      return;
    }
    const cached = this.cache.get(query);
    if (cached !== undefined) {
      this.respond(res, { metadata: cached });
      return;
    }
    await this.resolveAndRespond(res, query);
  }

  private async resolveAndRespond(
    res: express.Response,
    query: string,
  ): Promise<void> {
    try {
      const metadata = await this.fetch(query);
      this.cache.set(query, metadata);
      this.respond(res, { metadata });
    } catch (err) {
      this.deps.logger.warn("metadata lookup failed", {
        query,
        error: String(err),
      });
      this.typed(res, 502, this.error("fetch-failed"));
    }
  }

  private async fetch(query: string): Promise<MovieMetadata | null> {
    const apiKey = this.deps.config.metadataApiKey;
    if (!apiKey) return null;
    const url = `${SEARCH_URL}?api_key=${apiKey}&query=${
      encodeURIComponent(query)
    }`;
    const response = await this.doFetch(url);
    if (!response.ok) {
      throw new Error(`metadata api responded ${response.status}`);
    }
    const body: unknown = await response.json();
    return normalizeMovie(this.firstResult(body));
  }

  private firstResult(body: unknown): unknown {
    if (!isRecord(body) || !Array.isArray(body.results)) return null;
    return body.results[0] ?? null;
  }

  private doFetch(url: string): Promise<Response> {
    const fetchLike = this.deps.fetchLike ?? globalThis.fetch;
    return fetchLike(url);
  }

  private rateLimit(ip: string): boolean {
    const now = (this.deps.now ?? Date.now)();
    const entry = this.rate.get(ip);
    if (!entry || now - entry.startedAt >= RATE_WINDOW_MS) {
      this.rate.set(ip, { count: 1, startedAt: now });
      return true;
    }
    if (entry.count >= this.deps.config.metadataRateLimit) return false;
    entry.count += 1;
    return true;
  }

  private error(reason: string): AppError {
    return new AppError("MEDIA_URL_UNPLAYABLE", {
      detail: { stage: "metadata", reason },
    });
  }

  private respond(res: express.Response, payload: MetadataPayload): void {
    res.status(200).json(payload);
  }

  private typed(res: express.Response, status: number, err: AppError): void {
    res.status(status).json(err.toJSON());
  }
}
