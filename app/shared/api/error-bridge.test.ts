import { assertEquals } from "@std/assert";
import { AppError } from "contracts/app-error.ts";
import type { AppErrorPayload } from "contracts/app-error-payload.ts";
import type { ErrorCode } from "contracts/error-code.ts";
import { ERROR_DEFS } from "contracts/error-messages.ts";
import { severityOf, toAppErrorPayload } from "./error-bridge.ts";

// 1. Happy: AppError passes through its canonical JSON payload.
Deno.test("AppError maps through toJSON with code, message, and recovery", () => {
  const err = new AppError("TRANSPORT_PEER_FAILED");
  const payload = toAppErrorPayload(err);
  assertEquals(payload.code, "TRANSPORT_PEER_FAILED");
  assertEquals(payload.message, ERROR_DEFS.TRANSPORT_PEER_FAILED.message);
  assertEquals(payload.recovery?.label, "Retry");
  assertEquals(payload.recovery?.action.kind, "retry");
});

// 2. Sad: unknown thrown values collapse to SERVER_INTERNAL.
Deno.test("thrown string maps to SERVER_INTERNAL", () => {
  const payload = toAppErrorPayload("boom");
  assertEquals(payload.code, "SERVER_INTERNAL");
  assertEquals(payload.message, ERROR_DEFS.SERVER_INTERNAL.message);
});

Deno.test("null and plain Error map to SERVER_INTERNAL", () => {
  assertEquals(toAppErrorPayload(null).code, "SERVER_INTERNAL");
  assertEquals(toAppErrorPayload(new Error("boom")).code, "SERVER_INTERNAL");
});

// 3. Edge: already-shaped payloads pass through; detail survives.
Deno.test("already-shaped payload passes through unchanged", () => {
  const payload: AppErrorPayload = {
    code: "ROOM_FULL",
    message: "room is full",
    recovery: { label: "Leave", action: { kind: "home" } },
    detail: { memberId: "m1" },
  };
  const out = toAppErrorPayload(payload);
  assertEquals(out, payload);
  assertEquals(out.detail, { memberId: "m1" });
});

// 3b. Edge: route error responses map to canonical codes.
Deno.test("route error 404 maps to ROOM_NOT_FOUND with home recovery", () => {
  const response = { status: 404, statusText: "Not Found", data: "missing" };
  const payload = toAppErrorPayload(response);
  assertEquals(payload.code, "ROOM_NOT_FOUND");
  assertEquals(payload.recovery?.action.kind, "home");
});

Deno.test("route error 500 maps to SERVER_INTERNAL", () => {
  const response = { status: 500, statusText: "Oops", data: "x" };
  assertEquals(toAppErrorPayload(response).code, "SERVER_INTERNAL");
});

// 4. Mutation: severity derives from ERROR_DEFS recovery presence.
Deno.test("codes with a recovery in ERROR_DEFS are recoverable", () => {
  const recoverable: ErrorCode[] = [
    "VALIDATION_CHAT_TOO_LONG",
    "ROOM_NOT_FOUND",
    "ROOM_ENDED",
    "MEDIA_UPLOAD_FAILED",
    "MEDIA_URL_UNPLAYABLE",
    "SYNC_DRIFT_OUT_OF_BOUNDS",
    "TRANSPORT_DISCONNECTED",
    "TRANSPORT_RECONNECT_FAILED",
    "TRANSPORT_PEER_FAILED",
  ];
  for (const code of recoverable) {
    assertEquals(severityOf(code), "recoverable", code);
  }
});

Deno.test("codes without a recovery in ERROR_DEFS are terminal", () => {
  const terminal: ErrorCode[] = [
    "VALIDATION_NAME_EMPTY",
    "VALIDATION_CODE_MALFORMED",
    "VALIDATION_URL_UNSUPPORTED",
    "ROOM_FULL",
    "ROOM_LOCKED",
    "ROOM_PERMISSION_DENIED",
    "MEDIA_CAPTURE_FAILED",
    "MEDIA_UNSUPPORTED_CODEC",
    "SYNC_MEDIA_NOT_READY",
    "SERVER_INTERNAL",
    "SERVER_RATE_LIMITED",
    "SERVER_ROOM_CAPACITY",
  ];
  for (const code of terminal) {
    assertEquals(severityOf(code), "terminal", code);
  }
});

// 5. Limits: malformed input never throws.
Deno.test("malformed empty object maps to SERVER_INTERNAL", () => {
  assertEquals(toAppErrorPayload({}).code, "SERVER_INTERNAL");
});

Deno.test("unknown runtime code falls back without throwing", () => {
  const payload = toAppErrorPayload({ code: "NOT_A_CODE", message: "x" });
  assertEquals(payload.code, "SERVER_INTERNAL");
  assertEquals(severityOf("NOT_A_CODE" as ErrorCode), "terminal");
});
