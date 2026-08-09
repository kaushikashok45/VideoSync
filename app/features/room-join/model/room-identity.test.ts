import { assertEquals } from "@std/assert";
import {
  resolveCanonicalRoomIdentity,
  type RoomIdentityResolution,
} from "./room-identity.ts";

function assertResolved(
  actual: RoomIdentityResolution | null,
  expected: RoomIdentityResolution,
) {
  assertEquals(actual, expected);
}

// Happy: the route value wins and is normalized through the join-code rules.
Deno.test("resolveCanonicalRoomIdentity prefers the route value", () => {
  assertResolved(
    resolveCanonicalRoomIdentity(" ABC23 ", "zzzzz"),
    {
      status: "mismatch",
      source: "route",
      roomId: "abc23",
      recovery: { kind: "sync-session", roomId: "abc23" },
    },
  );
});

// Happy: when only the session value exists, it becomes canonical.
Deno.test("resolveCanonicalRoomIdentity falls back to the session value", () => {
  assertResolved(
    resolveCanonicalRoomIdentity(null, "  abc23  "),
    {
      status: "resolved",
      source: "session",
      roomId: "abc23",
    },
  );
});

// Sad: invalid values do not produce a canonical room id.
Deno.test("resolveCanonicalRoomIdentity rejects invalid route and session values", () => {
  assertEquals(resolveCanonicalRoomIdentity("abc", "!!!"), null);
});
