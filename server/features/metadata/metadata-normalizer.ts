import type { MovieMetadata } from "../../../shared/contracts/movie-metadata.ts";

const POSTER_BASE = "https://image.tmdb.org/t/p/";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function runtimeOf(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    return null;
  }
  return value;
}

function yearFrom(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = /^(\d{4})/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  return year >= 1000 && year <= 9999 ? year : null;
}

function namesOf(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const names: string[] = [];
  for (const item of value) {
    if (isObject(item) && typeof item.name === "string" && item.name !== "") {
      names.push(item.name);
    }
  }
  return names;
}

function imageUrl(value: unknown, size: string): string {
  if (typeof value !== "string" || value === "") return "";
  return `${POSTER_BASE}${size}${value}`;
}

function ratingFor(payload: Record<string, unknown>): string {
  return payload.adult === true ? "18+" : "PG-13";
}

export function normalizeMovie(payload: unknown): MovieMetadata | null {
  if (!isObject(payload)) return null;
  const title = str(payload.title).trim();
  if (title === "") return null;
  const releaseYear = yearFrom(payload.release_date);
  const runtime = runtimeOf(payload.runtime);
  if (releaseYear === null || runtime === null) return null;
  return {
    title,
    overview: str(payload.overview),
    posterUrl: imageUrl(payload.poster_path, "w500"),
    backdropUrl: imageUrl(payload.backdrop_path, "w1280"),
    releaseYear,
    ageRating: ratingFor(payload),
    runtime,
    genres: namesOf(payload.genres),
    cast: namesOf(payload.cast),
  };
}
