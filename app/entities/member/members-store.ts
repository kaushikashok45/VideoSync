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

export function createMembersStore(): MembersStore {
  return createStore<MembersState>()((set, get) => ({
    members: [],
    me: null,
    controlRequests: [],
    setMembers(members, meId) {
      set({ members, me: members.find((m) => m.id === meId) ?? null });
    },
    addMember(m) {
      const { members } = get();
      if (members.some((x) => x.id === m.id)) return;
      set({ members: [...members, m] });
    },
    removeMember(id) {
      const { members, me, controlRequests } = get();
      set({
        members: members.filter((m) => m.id !== id),
        controlRequests: controlRequests.filter((m) => m.id !== id),
        me: me?.id === id ? null : me,
      });
    },
    grantControl(id) {
      const { members, me } = get();
      assertCanControl(me);
      set({
        members: updateMember(
          members,
          id,
          (m) => memberIsHost(m) ? m : { ...m, canControl: true },
        ),
      });
    },
    revokeControl(id) {
      const { members, me } = get();
      assertIsHost(me);
      set({
        members: updateMember(
          members,
          id,
          (m) => memberIsHost(m) ? m : { ...m, canControl: false },
        ),
      });
    },
    toggleEveryoneControl() {
      const { members, me } = get();
      assertIsHost(me);
      set({
        members: members.map((m) =>
          memberIsHost(m) ? m : { ...m, canControl: !m.canControl }
        ),
      });
    },
    enqueueRequest(m) {
      const { controlRequests } = get();
      if (controlRequests.some((r) => r.id === m.id)) return;
      set({ controlRequests: [...controlRequests, m] });
    },
    approveRequest(id) {
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
    },
    denyRequest(id) {
      const { controlRequests } = get();
      set({
        controlRequests: controlRequests.filter((r) => r.id !== id),
      });
    },
    isHost() {
      return memberIsHost(get().me);
    },
    canControl() {
      return memberCanControl(get().me);
    },
  }));
}
