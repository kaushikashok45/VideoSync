import { fetchMetadata } from "~/shared/api/metadata-client.ts";
import type { MediaSource } from "contracts/media-source.ts";
import type { MovieMetadata } from "contracts/movie-metadata.ts";

export type SourceKind = "upload" | "url";
export type FetchMetadataLike = typeof fetchMetadata;

export const URL_ERROR_EMPTY = "Paste a URL to get started.";
export const URL_ERROR_SCHEME =
  'Enter a valid URL beginning with "http://" or "https://".';
export const URL_ERROR_PROTOCOL = "Only http and https URLs are supported.";
export const URL_ERROR_LOOKUP =
  "Could not look up that URL. Check it and retry.";
export const UPLOAD_ERROR_NO_FILE = "Choose a video file to start.";

export function validateUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (trimmed === "") return URL_ERROR_EMPTY;
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return URL_ERROR_SCHEME;
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return URL_ERROR_PROTOCOL;
  }
  return null;
}

export function buildHostRoute(roomId: string): string {
  return `/${roomId}/HostVideoPlayerNew`;
}

export interface ResolveSourceInput {
  mode: SourceKind;
  url: string;
  file: File | null;
}

export interface ResolveSourceDeps {
  roomId: string;
  fetchMetadataLike?: FetchMetadataLike;
}

export type SourceDecision =
  | { status: "error"; error: string }
  | {
    status: "navigating";
    route: string;
    source: MediaSource;
    metadata: MovieMetadata | null;
  };

export function resolveSource(
  input: ResolveSourceInput,
  deps: ResolveSourceDeps,
): Promise<SourceDecision> {
  if (input.mode === "upload") {
    return Promise.resolve(resolveUpload(input.file, deps.roomId));
  }
  return resolveUrl(input.url, deps);
}

function resolveUpload(file: File | null, roomId: string): SourceDecision {
  if (file === null) {
    return { status: "error", error: UPLOAD_ERROR_NO_FILE };
  }
  return {
    status: "navigating",
    route: buildHostRoute(roomId),
    source: { mode: "upload" },
    metadata: null,
  };
}

async function resolveUrl(
  url: string,
  deps: ResolveSourceDeps,
): Promise<SourceDecision> {
  const validationError = validateUrl(url);
  if (validationError !== null) {
    return { status: "error", error: validationError };
  }
  const trimmed = url.trim();
  const fetchLike = deps.fetchMetadataLike ?? fetchMetadata;
  try {
    const metadata = await fetchLike(trimmed);
    return {
      status: "navigating",
      route: buildHostRoute(deps.roomId),
      source: { mode: "url", url: trimmed },
      metadata,
    };
  } catch {
    return { status: "error", error: URL_ERROR_LOOKUP };
  }
}
