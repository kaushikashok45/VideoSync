import { assertEquals, assertThrows } from "@std/assert";
import { AppError } from "../../../shared/contracts/app-error.ts";
import type { Member } from "../../../shared/contracts/member.ts";
import {
  assertCanControl,
  canControlRoom,
  grantControl,
  isHost,
  revokeControl,
} from "./permissions.ts";

function member(over: Partial<Member> = {}): Member {
  return {
    id: "m1",
    name: "M",
    role: "viewer",
    joinedAt: 0,
    ...over,
    canControl: over.canControl ?? over.role === "host",
  };
}

// Happy path
Deno.test("host can always control the room", () => {
  const host = member({ role: "host" });
  assertEquals(isHost(host), true);
  assertEquals(canControlRoom(host), true);
});

// Happy path + edge
Deno.test("viewer with canControl flag can control the room; plain viewer cannot", () => {
  assertEquals(canControlRoom(member({ canControl: true })), true);
  assertEquals(canControlRoom(member()), false);
});

// Sad path
Deno.test("assertCanControl throws for a plain viewer", () => {
  assertThrows(() => assertCanControl(member()), AppError, "permission");
});

// Mutation case: grantControl flips only the target, requires a grantor
Deno.test("grantControl flips the target flag and requires a grantor", () => {
  const actor = member({ role: "host" });
  const target = member();
  grantControl(actor, target);
  assertEquals(target.canControl, true);
  assertThrows(() => grantControl(member(), member()), AppError, "permission");
});

// Mutation case: grantControl cannot demote a host
Deno.test("grantControl leaves a host unchanged", () => {
  const actor = member({ role: "host" });
  const target = member({ role: "host" });
  grantControl(actor, target);
  assertEquals(target.role, "host");
  assertEquals(target.canControl, true);
});

// Sad path + logical limit
Deno.test("revokeControl is host-only and cannot revoke a host", () => {
  const host = member({ role: "host" });
  const target = member({ canControl: true });
  revokeControl(host, target);
  assertEquals(target.canControl, false);
  const otherHost = member({ id: "h2", role: "host" });
  revokeControl(host, otherHost);
  assertEquals(otherHost.canControl, true);
  assertThrows(() => revokeControl(member(), member()), AppError, "permission");
});

// Edge: repeated grant/revoke is idempotent
Deno.test("repeated grant then revoke returns to not-controlling", () => {
  const host = member({ role: "host" });
  const target = member();
  grantControl(host, target);
  grantControl(host, target);
  assertEquals(target.canControl, true);
  revokeControl(host, target);
  revokeControl(host, target);
  assertEquals(target.canControl, false);
});
