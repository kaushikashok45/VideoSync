import type { MovieMetadata } from "../../../shared/contracts/movie-metadata.ts";
import { normalizeMovie } from "./metadata-normalizer.ts";

export type FetchLike = (
  url: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export interface TmdbClientDeps {
  apiKey: string;
  fetchLike: FetchLike;
}

const SEARCH_URL = "https://api.themoviedb.org/3/search/movie";
const DETAIL_URL = "https://api.themoviedb.org/3/movie";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function firstResult(body: unknown): unknown {
  if (!isRecord(body) || !Array.isArray(body.results)) return null;
  return body.results[0] ?? null;
}

export class TmdbClient {
  constructor(private deps: TmdbClientDeps) {}

  async fetchByTitle(query: string): Promise<MovieMetadata | null> {
    if (this.deps.apiKey === "") return null;
    const hit = await this.search(query);
    if (hit === null) return null;
    return this.detail(hit);
  }

  private async search(query: string): Promise<unknown> {
    const url = `${SEARCH_URL}?api_key=${this.deps.apiKey}&query=${
      encodeURIComponent(query)
    }`;
    return firstResult(await this.json(url));
  }

  private async detail(hit: unknown): Promise<MovieMetadata | null> {
    const id = isRecord(hit) ? hit.id : undefined;
    if (typeof id !== "number") return null;
    const url = `${DETAIL_URL}/${id}?api_key=${this.deps.apiKey}` +
      "&append_to_response=credits";
    const body = await this.json(url);
    if (!isRecord(body)) return null;
    const credits = isRecord(body.credits) ? body.credits : {};
    const cast = Array.isArray(credits.cast) ? credits.cast : [];
    return normalizeMovie({ ...body, cast });
  }

  private async json(url: string): Promise<unknown> {
    const response = await this.deps.fetchLike(url);
    if (!response.ok) {
      throw new Error(`metadata api responded ${response.status}`);
    }
    return response.json();
  }
}
