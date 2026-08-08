import type express from "express";
import { AppError } from "../../../shared/contracts/app-error.ts";
import type { MetadataPayload } from "../../../shared/contracts/payloads/metadata-payload.ts";
import type { MovieMetadata } from "../../../shared/contracts/movie-metadata.ts";
import type { AppConfig } from "../../app/config.ts";
import type { Logger } from "../../shared/logger/logger.ts";
import { MetadataCache } from "./metadata-cache.ts";
import { TmdbClient } from "./metadata-tmdb.ts";
import type { FetchLike } from "./metadata-tmdb.ts";

export type { FetchLike } from "./metadata-tmdb.ts";

export interface MetadataHandlerDeps {
  app: express.Express;
  config: AppConfig;
  logger: Logger;
  fetchLike?: FetchLike;
  now?: () => number;
}

const RATE_WINDOW_MS = 60_000;

interface RateEntry {
  count: number;
  startedAt: number;
}

export class MetadataHandler {
  private cache: MetadataCache<MovieMetadata | null>;
  private rate = new Map<string, RateEntry>();
  private tmdb: TmdbClient;

  constructor(private deps: MetadataHandlerDeps) {
    this.cache = new MetadataCache<MovieMetadata | null>({
      ttlMs: this.deps.config.metadataTtlMs,
      now: this.deps.now ?? Date.now,
    });
    this.tmdb = new TmdbClient({
      apiKey: this.deps.config.metadataApiKey ?? "",
      fetchLike: this.deps.fetchLike ?? globalThis.fetch,
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
      const metadata = await this.tmdb.fetchByTitle(query);
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
