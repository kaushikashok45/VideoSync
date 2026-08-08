import type { MovieMetadata } from "./movie-metadata.ts";

export interface RoomMeta {
  code: string;
  locked: boolean;
  hostId: string;
  memberCount: number;
  maxMembers: number;
  metadata?: MovieMetadata;
}
