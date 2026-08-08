import { AppError } from "../../../shared/contracts/app-error.ts";
import type { Member } from "../../../shared/contracts/member.ts";

export function isHost(member: Member): boolean {
  return member.role === "host";
}

export function canControlRoom(member: Member): boolean {
  return member.role === "host" || member.canControl;
}

export function assertCanControl(member: Member): void {
  if (!canControlRoom(member)) throw new AppError("ROOM_PERMISSION_DENIED");
}

export function grantControl(actor: Member, target: Member): void {
  assertCanControl(actor);
  if (isHost(target)) return;
  target.canControl = true;
}

export function revokeControl(actor: Member, target: Member): void {
  if (!isHost(actor)) throw new AppError("ROOM_PERMISSION_DENIED");
  if (isHost(target)) return;
  target.canControl = false;
}
