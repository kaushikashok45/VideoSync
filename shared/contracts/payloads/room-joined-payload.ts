import type { Member } from "../member.ts";
import type { RoomMeta } from "../room-meta.ts";

export interface RoomJoinedPayload {
  room: RoomMeta;
  members: Member[];
}
