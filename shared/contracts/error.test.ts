import { assertEquals } from "@std/assert";
import { AppError } from "./app-error.ts";
import { errorMessageFor } from "./error-messages.ts";

// Happy path
Deno.test("AppError carries a stable code and a human message", () => {
  const err = new AppError("ROOM_NOT_FOUND");
  assertEquals(err.code, "ROOM_NOT_FOUND");
  assertEquals(typeof err.message, "string");
  assertEquals(err.message.length > 0, true);
});

// Happy path
Deno.test("errorMessageFor returns a non-empty message for every declared code", () => {
  const codes: string[] = [
    "VALIDATION_NAME_EMPTY",
    "VALIDATION_CODE_MALFORMED",
    "VALIDATION_URL_UNSUPPORTED",
    "VALIDATION_CHAT_TOO_LONG",
    "ROOM_NOT_FOUND",
    "ROOM_FULL",
    "ROOM_LOCKED",
    "ROOM_ENDED",
    "ROOM_PERMISSION_DENIED",
    "MEDIA_UPLOAD_FAILED",
    "MEDIA_CAPTURE_FAILED",
    "MEDIA_UNSUPPORTED_CODEC",
    "MEDIA_URL_UNPLAYABLE",
    "SYNC_DRIFT_OUT_OF_BOUNDS",
    "SYNC_MEDIA_NOT_READY",
    "TRANSPORT_DISCONNECTED",
    "TRANSPORT_RECONNECT_FAILED",
    "TRANSPORT_PEER_FAILED",
    "SERVER_INTERNAL",
    "SERVER_RATE_LIMITED",
    "SERVER_ROOM_CAPACITY",
  ];
  for (const code of codes) {
    assertEquals(
      errorMessageFor(code as never).length > 0,
      true,
      `missing message for ${code}`,
    );
  }
});

// Sad path + mutation: serialization must NOT leak the stack trace
Deno.test("AppError serializes to a plain payload without a stack", () => {
  const err = new AppError("ROOM_PERMISSION_DENIED", {
    detail: { actorId: "x" },
  });
  const json = err.toJSON();
  assertEquals(json.code, "ROOM_PERMISSION_DENIED");
  assertEquals(json.detail, { actorId: "x" });
  assertEquals("stack" in json, false);
});

// Mutation case: custom detail must not be overwritten by defaults
Deno.test("custom detail and recovery override defaults", () => {
  const err = new AppError("ROOM_FULL", {
    detail: { memberId: "m1" },
    recovery: { label: "Leave and retry", action: { kind: "retry" } },
  });
  const recovery = err.recovery;
  assertEquals(err.detail, { memberId: "m1" });
  assertEquals(recovery?.label, "Leave and retry");
  assertEquals(recovery?.action.kind, "retry");
});

// Recoverable errors expose a recovery action; non-recoverable don't
Deno.test("recoverable errors expose a recovery action", () => {
  const err = new AppError("TRANSPORT_PEER_FAILED");
  const recovery = err.recovery;
  assertEquals(recovery?.action.kind, "retry");
  assertEquals(typeof recovery?.label, "string");
});

Deno.test("non-recoverable errors have no recovery", () => {
  const err = new AppError("MEDIA_UNSUPPORTED_CODEC");
  assertEquals(err.recovery, undefined);
});

// Edge: message falls back to the canonical human map
Deno.test("AppError.message equals the canonical human message", () => {
  const err = new AppError("ROOM_LOCKED");
  assertEquals(err.message, errorMessageFor("ROOM_LOCKED"));
});
