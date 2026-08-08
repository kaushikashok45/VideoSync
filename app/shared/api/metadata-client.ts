import { AppError } from "contracts/app-error.ts";
import type { MetadataPayload } from "contracts/payloads/metadata-payload.ts";
import type { MovieMetadata } from "contracts/movie-metadata.ts";

export type FetchLike = (
  url: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

export interface MetadataClientDeps {
  fetchLike?: FetchLike;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function metadataError(
  reason: string,
  extra: Record<string, unknown> = {},
): AppError {
  return new AppError("MEDIA_URL_UNPLAYABLE", {
    detail: { stage: "metadata", reason, ...extra },
  });
}

export async function fetchMetadata(
  query: string,
  deps: MetadataClientDeps = {},
): Promise<MovieMetadata | null> {
  const doFetch = deps.fetchLike ?? globalThis.fetch;
  let response: Response;
  try {
    response = await doFetch(`/api/metadata?q=${encodeURIComponent(query)}`);
  } catch (err) {
    throw metadataError("network-failed", { error: String(err) });
  }
  if (!response.ok) {
    throw metadataError("http-error", { status: response.status });
  }
  let body: unknown;
  try {
    body = await response.json();
  } catch (err) {
    throw metadataError("malformed-response", { error: String(err) });
  }
  if (!isRecord(body) || !("metadata" in body)) {
    throw metadataError("malformed-response");
  }
  return (body as unknown as MetadataPayload).metadata;
}
