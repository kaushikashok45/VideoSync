import { assertEquals } from "@std/assert";
import { AppError } from "contracts/app-error.ts";
import type { Member } from "contracts/member.ts";
import {
  createMembersStore,
  type MembersStore,
} from "~/entities/member/members-store.ts";
import {
  approveControlRequest,
  type ClipboardLike,
  copyRoomCode,
  denyControlRequest,
  grantMemberControl,
  nextLockState,
  revokeMemberControl,
  toggleEveryoneControl,
} from "./host-tools-behaviour.ts";

function m(
  id: string,
  role: Member["role"] = "viewer",
  canControl = false,
): Member {
  return { id, name: `n-${id}`, role, canControl, joinedAt: 100 };
}
function hostRoom(): { store: MembersStore; host: Member } {
  const store = createMembersStore();
  store.getState().setMembers(
    [m("host", "host", true), m("v1"), m("v2")],
    "host",
  );
  return { store, host: store.getState().me as Member };
}
function controlOf(store: MembersStore, id: string): boolean | undefined {
  return store.getState().members.find((x) => x.id === id)?.canControl;
}
function denied(fn: () => void): AppError {
  try {
    fn();
  } catch (err) {
    return err as AppError;
  }
  throw new Error("expected a typed AppError");
}
function assertDenied(fn: () => void): void {
  assertEquals(denied(fn).code, "ROOM_PERMISSION_DENIED");
}
// 1. Happy path: the host grants/revokes control, flips everyone, and locks.
Deno.test("host grants and revokes a viewer's control", () => {
  const { store, host } = hostRoom();
  grantMemberControl(store, host, "v1");
  assertEquals(controlOf(store, "v1"), true);
  revokeMemberControl(store, host, "v1");
  assertEquals(controlOf(store, "v1"), false);
});
Deno.test("host toggles everyone's control, host member untouched", () => {
  const { store, host } = hostRoom();
  toggleEveryoneControl(store, host);
  assertEquals(controlOf(store, "v1"), true);
  assertEquals(controlOf(store, "v2"), true);
  assertEquals(controlOf(store, "host"), true);
});
Deno.test("nextLockState flips the lock boolean both ways", () => {
  assertEquals(nextLockState(false), true);
  assertEquals(nextLockState(true), false);
});
// 2. Sad path: a non-host (even a conductor) is denied by the host-tools gate.
Deno.test("non-host member is denied every host action with ROOM_PERMISSION_DENIED", () => {
  const store = createMembersStore();
  store.getState().setMembers(
    [m("host", "host", true), m("v1"), m("me")],
    "me",
  );
  const me = store.getState().me as Member;
  assertDenied(() => grantMemberControl(store, me, "v1"));
  assertDenied(() => revokeMemberControl(store, me, "v1"));
  assertDenied(() => toggleEveryoneControl(store, me));
  assertDenied(() => approveControlRequest(store, me, "v1"));
  assertDenied(() => denyControlRequest(store, me, "v1"));
  assertEquals(controlOf(store, "v1"), false);
});
Deno.test("a conductor (canControl viewer) is still denied: host-tools are host-only", () => {
  const store = createMembersStore();
  store.getState().setMembers(
    [m("host", "host", true), m("me", "viewer", true), m("v1")],
    "me",
  );
  assertDenied(() =>
    grantMemberControl(store, store.getState().me as Member, "v1")
  );
  assertEquals(controlOf(store, "v1"), false);
});
// 3. Edge case: me null is treated as denied.
Deno.test("null me is denied with ROOM_PERMISSION_DENIED", () => {
  const { store } = hostRoom();
  assertDenied(() => grantMemberControl(store, null, "v1"));
  assertDenied(() => toggleEveryoneControl(store, null));
});
// 4. Mutation pins: permission checks are not dropped; grant never touches the host.
Deno.test("granting control never demotes or alters the host member", () => {
  const { store, host } = hostRoom();
  grantMemberControl(store, host, "host");
  assertEquals(controlOf(store, "host"), true);
  grantMemberControl(store, host, "v1");
  assertEquals(controlOf(store, "host"), true);
});
Deno.test("dropping the host gate would fail: a viewer action throws before the store", () => {
  const store = createMembersStore();
  store.getState().setMembers([m("host", "host", true), m("me")], "me");
  const err = denied(() =>
    revokeMemberControl(store, store.getState().me as Member, "host")
  );
  assertEquals(err.code, "ROOM_PERMISSION_DENIED");
});
// 5. Logical limits: approve/deny remove exactly the right request.
Deno.test("approve removes exactly the approved request and grants control", () => {
  const { store, host } = hostRoom();
  store.getState().enqueueRequest(m("v1"));
  store.getState().enqueueRequest(m("v2"));
  approveControlRequest(store, host, "v1");
  assertEquals(store.getState().controlRequests.map((r) => r.id), ["v2"]);
  assertEquals(controlOf(store, "v1"), true);
  assertEquals(controlOf(store, "v2"), false);
});
Deno.test("deny removes exactly the denied request without granting control", () => {
  const { store, host } = hostRoom();
  store.getState().enqueueRequest(m("v1"));
  store.getState().enqueueRequest(m("v2"));
  denyControlRequest(store, host, "v2");
  assertEquals(store.getState().controlRequests.map((r) => r.id), ["v1"]);
  assertEquals(controlOf(store, "v2"), false);
});
// 5b. copyRoomCode: guarded for SSR and reports clipboard success/failure.
Deno.test("copyRoomCode writes the room code when a clipboard is available", async () => {
  const written: string[] = [];
  const clipboard: ClipboardLike = {
    writeText: (text: string) => {
      written.push(text);
      return Promise.resolve();
    },
  };
  assertEquals(await copyRoomCode("abc23", clipboard), true);
  assertEquals(written, ["abc23"]);
});
Deno.test("copyRoomCode returns false when no clipboard exists", async () => {
  assertEquals(await copyRoomCode("abc23", undefined), false);
});
