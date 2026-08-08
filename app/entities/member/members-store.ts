import { createStore, type StoreApi } from "zustand/vanilla";
import { AppError } from "contracts/app-error.ts";
import type { Member } from "contracts/member.ts";

export interface MembersState {
  members: Member[];
  me: Member | null;
  controlRequests: Member[];
  setMembers(members: Member[], meId: string): void;
  addMember(m: Member): void;
  removeMember(id: string): void;
  grantControl(id: string): void;
  revokeControl(id: string): void;
  toggleEveryoneControl(): void;
  enqueueRequest(m: Member): void;
  approveRequest(id: string): void;
  denyRequest(id: string): void;
  isHost(): boolean;
  canControl(): boolean;
}

export type MembersStore = StoreApi<MembersState>;

type SetFn = MembersStore["setState"];
type GetFn = MembersStore["getState"];

function memberIsHost(m: Member | null): boolean {
  return m?.role === "host";
}

function memberCanControl(m: Member | null): boolean {
  return m ? m.role === "host" || m.canControl : false;
}

function assertCanControl(m: Member | null): void {
  if (!memberCanControl(m)) throw new AppError("ROOM_PERMISSION_DENIED");
}

function assertIsHost(m: Member | null): void {
  if (!memberIsHost(m)) throw new AppError("ROOM_PERMISSION_DENIED");
}

function updateMember(
  members: Member[],
  id: string,
  change: (m: Member) => Member,
): Member[] {
  return members.map((m) => (m.id === id ? change(m) : m));
}

function setMembersAction(set: SetFn, members: Member[], meId: string): void {
  set({ members, me: members.find((m) => m.id === meId) ?? null });
}
function addMemberAction(set: SetFn, get: GetFn, m: Member): void {
  const { members } = get();
  if (members.some((x) => x.id === m.id)) return;
  set({ members: [...members, m] });
}
function removeMemberAction(set: SetFn, get: GetFn, id: string): void {
  const { members, me, controlRequests } = get();
  set({
    members: members.filter((m) => m.id !== id),
    controlRequests: controlRequests.filter((m) => m.id !== id),
    me: me?.id === id ? null : me,
  });
}
function grantControlAction(set: SetFn, get: GetFn, id: string): void {
  const { members, me } = get();
  assertCanControl(me);
  set({
    members: updateMember(
      members,
      id,
      (m) => memberIsHost(m) ? m : { ...m, canControl: true },
    ),
  });
}
function revokeControlAction(set: SetFn, get: GetFn, id: string): void {
  const { members, me } = get();
  assertIsHost(me);
  set({
    members: updateMember(
      members,
      id,
      (m) => memberIsHost(m) ? m : { ...m, canControl: false },
    ),
  });
}
function toggleEveryoneControlAction(set: SetFn, get: GetFn): void {
  const { members, me } = get();
  assertIsHost(me);
  set({
    members: members.map((m) =>
      memberIsHost(m) ? m : { ...m, canControl: !m.canControl }
    ),
  });
}
function enqueueRequestAction(set: SetFn, get: GetFn, m: Member): void {
  const { controlRequests } = get();
  if (controlRequests.some((r) => r.id === m.id)) return;
  set({ controlRequests: [...controlRequests, m] });
}
function approveRequestAction(set: SetFn, get: GetFn, id: string): void {
  const { controlRequests, members, me } = get();
  if (!controlRequests.some((r) => r.id === id)) return;
  assertCanControl(me);
  set({
    controlRequests: controlRequests.filter((r) => r.id !== id),
    members: updateMember(
      members,
      id,
      (m) => memberIsHost(m) ? m : { ...m, canControl: true },
    ),
  });
}
function denyRequestAction(set: SetFn, get: GetFn, id: string): void {
  const { controlRequests } = get();
  set({
    controlRequests: controlRequests.filter((r) => r.id !== id),
  });
}
function isHostAction(get: GetFn): boolean {
  return memberIsHost(get().me);
}
function canControlAction(get: GetFn): boolean {
  return memberCanControl(get().me);
}

export function createMembersStore(): MembersStore {
  return createStore<MembersState>()((set, get) => ({
    members: [],
    me: null,
    controlRequests: [],
    setMembers: (members, meId) => setMembersAction(set, members, meId),
    addMember: (m) => addMemberAction(set, get, m),
    removeMember: (id) => removeMemberAction(set, get, id),
    grantControl: (id) => grantControlAction(set, get, id),
    revokeControl: (id) => revokeControlAction(set, get, id),
    toggleEveryoneControl: () => toggleEveryoneControlAction(set, get),
    enqueueRequest: (m) => enqueueRequestAction(set, get, m),
    approveRequest: (id) => approveRequestAction(set, get, id),
    denyRequest: (id) => denyRequestAction(set, get, id),
    isHost: () => isHostAction(get),
    canControl: () => canControlAction(get),
  }));
}
