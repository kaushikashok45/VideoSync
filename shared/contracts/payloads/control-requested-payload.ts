import type { Member } from "../member.ts";

export interface ControlRequestedPayload {
  requestId: string;
  member: Member;
}
