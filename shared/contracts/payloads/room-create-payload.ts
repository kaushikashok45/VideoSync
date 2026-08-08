import type { MovieMetadata } from "../movie-metadata.ts";

export interface RoomCreatePayload {
  name: string;
  metadata?: MovieMetadata;
}
