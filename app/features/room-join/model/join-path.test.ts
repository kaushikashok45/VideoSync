import { assertEquals } from "@std/assert";
import Role from "~/context/Session/contracts/Role.ts";
import { decideJoinPath, hostTarget, isHost, joinTarget } from "./join-path.ts";

const ROOM_ID = "abc23";

// Happy: HOST resolves to the upload path.
Deno.test("decideJoinPath maps HOST to the file-upload target", () => {
  const decision = decideJoinPath(Role.HOST, ROOM_ID, "Ada");
  assertEquals(decision, { path: "host", target: "/abc23/file-upload" });
});

// Happy: GUEST resolves to the receiver path.
Deno.test("decideJoinPath maps GUEST to the receiver target", () => {
  const decision = decideJoinPath(Role.GUEST, ROOM_ID, "Ada");
  assertEquals(decision, {
    path: "join",
    target: "/abc23/RecieverVideoPlayerNew",
  });
});

// Sad: an empty name rejects both paths.
Deno.test("decideJoinPath rejects an empty name for both roles", () => {
  assertEquals(decideJoinPath(Role.HOST, ROOM_ID, ""), null);
  assertEquals(decideJoinPath(Role.GUEST, ROOM_ID, "   "), null);
});

// Edge: GUEST is the default join path.
Deno.test("GUEST defaults to the join path", () => {
  assertEquals(isHost(Role.GUEST), false);
  assertEquals(decideJoinPath(Role.GUEST, ROOM_ID, "Ada")?.path, "join");
});

// Mutation: an inverted role decision would fail these guards.
Deno.test("isHost strictly distinguishes HOST from GUEST", () => {
  assertEquals(isHost(Role.HOST), true);
  assertEquals(isHost(Role.GUEST), false);
});

// Mutation: the two-path decision must reuse name validation.
Deno.test("decideJoinPath rejects a whitespace name via validateName", () => {
  assertEquals(decideJoinPath(Role.HOST, ROOM_ID, "  "), null);
  assertEquals(decideJoinPath(Role.GUEST, ROOM_ID, "  "), null);
});

// Limits: the decision honors the NAME_MAX boundary through validateName.
Deno.test("decideJoinPath honors the NAME_MAX boundary", () => {
  assertEquals(
    decideJoinPath(Role.GUEST, ROOM_ID, "a".repeat(60)) !== null,
    true,
  );
  assertEquals(decideJoinPath(Role.GUEST, ROOM_ID, "a".repeat(61)), null);
});

// Limits: target helpers pin the exact route names.
Deno.test("hostTarget and joinTarget pin the legacy route names", () => {
  assertEquals(hostTarget("abc23"), "/abc23/file-upload");
  assertEquals(joinTarget("abc23"), "/abc23/RecieverVideoPlayerNew");
});
