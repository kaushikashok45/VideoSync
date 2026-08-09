import { fetchMetadata } from "~/shared/api/metadata-client.ts";
import type { MovieMetadata } from "contracts/movie-metadata.ts";
import { deriveLocalTitle } from "~/features/entry-flow/logic/derive-local-title.ts";
import type { FetchMetadataLike } from "./source-resolver.ts";

export async function lookupLocalMetadata(
  file: File,
  fetchMetadataLike?: FetchMetadataLike,
): Promise<MovieMetadata | null> {
  const fetchLike = fetchMetadataLike ?? fetchMetadata;
  try {
    return await fetchLike(deriveLocalTitle(file.name));
  } catch {
    return null;
  }
}
