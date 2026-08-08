import type { MediaSource } from "../../../shared/contracts/media-source.ts";
import type { Member } from "../../../shared/contracts/member.ts";
import type { PlaybackSnapshot } from "../../../shared/contracts/playback.ts";

export interface Room {
  code: string;
  hostId: string;
  locked: boolean;
  members: Map<string, Member>;
  mediaSource: MediaSource | null;
  playback: PlaybackSnapshot;
  createdAt: number;
}
