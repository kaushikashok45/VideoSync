import { assertEquals } from "@std/assert";
import { resolveRoomState } from "./resolve-room-state.ts";

Deno.test("resolveRoomState prefers the normalized route room id", () => {
  assertEquals(resolveRoomState(" ABC23 ", "zzzzz"), {
    kind: "mismatch",
    roomId: "abc23",
    routeRoomId: "abc23",
    sessionRoomId: "zzzzz",
    recoveryLabel: "Use active room",
  });
});

Deno.test("resolveRoomState falls back to a valid session id when the route is missing", () => {
  assertEquals(resolveRoomState(undefined, " abc23 "), {
    kind: "ready",
    roomId: "abc23",
    source: "session",
  });
});

Deno.test("resolveRoomState rejects an invalid route id even when a session id exists", () => {
  assertEquals(resolveRoomState("bad!", "abc23"), {
    kind: "invalid",
    recoveryLabel: "Return home",
  });
});

Deno.test("resolveRoomState treats normalized route and session matches as ready", () => {
  assertEquals(resolveRoomState(" AbC23 ", "abc23"), {
    kind: "ready",
    roomId: "abc23",
    source: "route",
  });
});
