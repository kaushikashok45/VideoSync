import type { Member } from "../../../shared/contracts/member.ts";
import { freezeRoom } from "./freeze-room.ts";
import type { Room } from "./room.ts";

/** `MEMBER-INV-6`: returns the removed member; an unknown id is a no-op. */
export function removeMember(
  room: Room,
  memberId: string,
): { room: Room; removed: Member | undefined } {
  const removed = room.members.get(memberId);
  if (!removed) return { room, removed: undefined };
  const members = new Map(room.members);
  members.delete(memberId);
  return { room: freezeRoom({ ...room, members }), removed };
}
