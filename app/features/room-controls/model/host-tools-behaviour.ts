import { AppError } from "contracts/app-error.ts";
import type { Member } from "contracts/member.ts";
import type { MembersStore } from "~/entities/member/members-store.ts";

export interface ClipboardLike {
  writeText(text: string): Promise<void>;
}

export function isHost(me: Member | null): boolean {
  return me?.role === "host";
}

export function assertHost(me: Member | null): void {
  if (!isHost(me)) throw new AppError("ROOM_PERMISSION_DENIED");
}

export function grantMemberControl(
  store: MembersStore,
  me: Member | null,
  memberId: string,
): void {
  assertHost(me);
  store.getState().grantControl(memberId);
}

export function revokeMemberControl(
  store: MembersStore,
  me: Member | null,
  memberId: string,
): void {
  assertHost(me);
  store.getState().revokeControl(memberId);
}

export function toggleEveryoneControl(
  store: MembersStore,
  me: Member | null,
): void {
  assertHost(me);
  store.getState().toggleEveryoneControl();
}

export function approveControlRequest(
  store: MembersStore,
  me: Member | null,
  memberId: string,
): void {
  assertHost(me);
  store.getState().approveRequest(memberId);
}

export function denyControlRequest(
  store: MembersStore,
  me: Member | null,
  memberId: string,
): void {
  assertHost(me);
  store.getState().denyRequest(memberId);
}

export function nextLockState(locked: boolean): boolean {
  return !locked;
}

function globalClipboard(): ClipboardLike | undefined {
  if (typeof navigator === "undefined") return undefined;
  return (navigator as { clipboard?: ClipboardLike }).clipboard;
}

export async function copyRoomCode(
  roomCode: string,
  clipboard: ClipboardLike | undefined = globalClipboard(),
): Promise<boolean> {
  if (!clipboard) return false;
  try {
    await clipboard.writeText(roomCode);
    return true;
  } catch {
    return false;
  }
}
