import { assertEquals } from "@std/assert";
import { createErrorStore } from "./error-store.ts";
import type { AppErrorPayload } from "contracts/app-error-payload.ts";
import type { ErrorCode } from "contracts/error-code.ts";

function payload(code: ErrorCode): AppErrorPayload {
  return { code, message: `msg-${code}` };
}

// Happy: setError surfaces the latest error payload
Deno.test("setError stores the error payload", () => {
  const store = createErrorStore();
  store.getState().setError(payload("ROOM_FULL"));
  assertEquals(store.getState().lastError?.code, "ROOM_FULL");
});

// Sad: clearError resets lastError back to null
Deno.test("clearError resets lastError to null", () => {
  const store = createErrorStore();
  store.getState().setError(payload("ROOM_FULL"));
  store.getState().clearError();
  assertEquals(store.getState().lastError, null);
});

// Edge: a later error overwrites an earlier one (latest wins)
Deno.test("setError overwrites the previous error", () => {
  const store = createErrorStore();
  store.getState().setError(payload("ROOM_FULL"));
  store.getState().setError(payload("ROOM_ENDED"));
  assertEquals(store.getState().lastError?.code, "ROOM_ENDED");
});

// Mutation: clearError on an empty store is a safe, idempotent no-op
Deno.test("clearError on an empty store is idempotent", () => {
  const store = createErrorStore();
  store.getState().clearError();
  store.getState().clearError();
  assertEquals(store.getState().lastError, null);
});

// Limits: the store holds exactly one error at a time
Deno.test("the store holds exactly one error at a time", () => {
  const store = createErrorStore();
  store.getState().setError(payload("ROOM_FULL"));
  store.getState().setError(payload("ROOM_ENDED"));
  store.getState().setError(payload("ROOM_FULL"));
  assertEquals(store.getState().lastError?.code, "ROOM_FULL");
});
