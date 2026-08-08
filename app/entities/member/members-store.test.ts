import { assertEquals } from "@std/assert";
import { AppError } from "contracts/app-error.ts";
import { createMembersStore, type MembersStore } from "./members-store.ts";
import type { Member } from "contracts/member.ts";

function m(
  id: string,
  role: Member["role"] = "viewer",
  canControl = false,
): Member {
  return { id, name: `name-${id}`, role, canControl, joinedAt: 100_000 };
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

// Happy + edge: addMember appends and re-adding the same id is idempotent
Deno.test("addMember appends and is idempotent on re-add", () => {
  const store = createMembersStore();
  store.getState().addMember(m("a"));
  store.getState().addMember(m("a"));
  assertEquals(store.getState().members.length, 1);
  assertEquals(store.getState().members[0].id, "a");
});

// Happy: setMembers sets me and reflects host control
Deno.test("setMembers sets me and reflects host control", () => {
  const store = createMembersStore();
  store.getState().setMembers(
    [m("host", "host"), m("me", "viewer", true)],
    "me",
  );
  assertEquals(store.getState().me?.id, "me");
  assertEquals(store.getState().isHost(), false);
  assertEquals(store.getState().canControl(), true);
});

// Happy + edge: grant/revoke flip viewers but never demote a host
Deno.test("grantControl and revokeControl flip viewers but never a host", () => {
  const store = createMembersStore();
  store.getState().setMembers(
    [m("host", "host", true), m("v", "viewer", false)],
    "host",
  );
  store.getState().grantControl("v");
  assertEquals(controlOf(store, "v"), true);
  store.getState().revokeControl("v");
  assertEquals(controlOf(store, "v"), false);
  store.getState().revokeControl("host");
  store.getState().grantControl("host");
  assertEquals(controlOf(store, "host"), true);
});

// Sad: control actions by a non-privileged member throw a typed AppError
Deno.test("control actions without permission throw a typed AppError", () => {
  const store = createMembersStore();
  store.getState().setMembers(
    [m("host", "host"), m("me", "viewer"), m("v", "viewer", true)],
    "me",
  );
  assertDenied(() => store.getState().revokeControl("v"));
  assertDenied(() => store.getState().grantControl("v"));
  assertDenied(() => store.getState().toggleEveryoneControl());
});

// Mutation: approveRequest moves the request to controlled exactly once
Deno.test("approveRequest moves the request to controlled exactly once", () => {
  const store = createMembersStore();
  store.getState().setMembers(
    [m("host", "host"), m("v", "viewer", false)],
    "host",
  );
  store.getState().enqueueRequest(m("v", "viewer", false));
  store.getState().approveRequest("v");
  store.getState().approveRequest("v");
  assertEquals(store.getState().controlRequests.length, 0);
  assertEquals(controlOf(store, "v"), true);
});

// Mutation: denyRequest removes the request without granting control
Deno.test("denyRequest removes the request without granting control", () => {
  const store = createMembersStore();
  store.getState().setMembers(
    [m("host", "host"), m("v", "viewer", false)],
    "host",
  );
  store.getState().enqueueRequest(m("v", "viewer", false));
  store.getState().denyRequest("v");
  assertEquals(store.getState().controlRequests.length, 0);
  assertEquals(controlOf(store, "v"), false);
});

// Mutation: removeMember cleans the member and pending requests
Deno.test("removeMember removes the member and cleans pending requests", () => {
  const store = createMembersStore();
  store.getState().setMembers(
    [m("host", "host"), m("v", "viewer", false)],
    "host",
  );
  store.getState().enqueueRequest(m("v", "viewer", false));
  store.getState().removeMember("v");
  assertEquals(store.getState().members.length, 1);
  assertEquals(store.getState().controlRequests.length, 0);
});

// Logical limits: every-member toggle flips exactly all viewers, hosts unchanged
Deno.test("toggleEveryoneControl flips exactly all viewers and leaves hosts", () => {
  const store = createMembersStore();
  store.getState().setMembers(
    [
      m("host", "host", true),
      m("v1", "viewer", true),
      m("v2", "viewer", false),
      m("v3", "viewer", true),
    ],
    "host",
  );
  store.getState().toggleEveryoneControl();
  assertEquals(controlOf(store, "host"), true);
  assertEquals(controlOf(store, "v1"), false);
  assertEquals(controlOf(store, "v2"), true);
  assertEquals(controlOf(store, "v3"), false);
  store.getState().toggleEveryoneControl();
  assertEquals(controlOf(store, "v1"), true);
  assertEquals(controlOf(store, "v2"), false);
});
