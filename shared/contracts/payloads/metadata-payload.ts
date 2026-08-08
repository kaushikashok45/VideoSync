import type { MovieMetadata } from "../movie-metadata.ts";

export interface MetadataPayload {
  metadata: MovieMetadata | null;
}
