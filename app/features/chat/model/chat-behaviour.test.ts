import { assertEquals } from "@std/assert";
import type { ChatStore } from "~/entities/chat/chat-store.ts";
import { createChatStore } from "~/entities/chat/chat-store.ts";
import {
  CHAT_MAX_LENGTH,
  type ChatSendResult,
  sendChatMessage,
} from "./chat-behaviour.ts";

function store(maxMessages = 10): ChatStore {
  return createChatStore({ maxMessages });
}

function sent(result: ChatSendResult): string {
  assertEquals(result.status, "sent");
  if (result.status === "sent") return result.message.text;
  return "";
}

// 1. Happy path: a valid message is trimmed, appended, and tagged with the sender.
Deno.test("sends a valid message: trimmed text appended with senderName", () => {
  const s = store();
  const result = sendChatMessage(s, "  hello room  ", "alice");
  assertEquals(result.status, "sent");
  if (result.status === "sent") {
    assertEquals(result.message.text, "hello room");
    assertEquals(result.message.senderName, "alice");
    assertEquals(s.getState().messages.length, 1);
    assertEquals(s.getState().messages[0].text, "hello room");
  }
});

// 2. Sad path: empty and whitespace-only messages are rejected.
Deno.test("rejects empty and whitespace-only messages", () => {
  const s = store();
  assertEquals(sendChatMessage(s, "", "alice").status, "rejected");
  assertEquals(sendChatMessage(s, "   ", "alice").status, "rejected");
  assertEquals(s.getState().messages.length, 0);
});

// 3. Edge (documented): client-side throttling is not implemented; the server
//    rate-limits (5 msgs / 2s window). Pin the no-throttle behaviour instead.
Deno.test("consecutive sends are not throttled client-side (server-enforced)", () => {
  const s = store();
  for (let i = 0; i < 10; i++) {
    sendChatMessage(s, `m${i}`, "alice");
  }
  assertEquals(s.getState().messages.length, 10);
});

// 4. Mutation: send order is preserved as append order.
Deno.test("append order equals send order", () => {
  const s = store();
  sendChatMessage(s, "first", "alice");
  sendChatMessage(s, "second", "bob");
  sendChatMessage(s, "third", "carol");
  assertEquals(
    s.getState().messages.map((m) => m.text),
    ["first", "second", "third"],
  );
});

// 4b. Mutation: trimming leading/trailing whitespace must not be dropped.
Deno.test("trim is not dropped: surrounding whitespace never reaches the store", () => {
  const s = store();
  assertEquals(sent(sendChatMessage(s, "   padded   ", "alice")), "padded");
  assertEquals(s.getState().messages[0].text, "padded");
});

// 5. Limits: over-length is rejected with VALIDATION_CHAT_TOO_LONG; at-limit passes.
Deno.test("over-length message is rejected with VALIDATION_CHAT_TOO_LONG", () => {
  const s = store();
  const result = sendChatMessage(s, "x".repeat(CHAT_MAX_LENGTH + 1), "alice");
  assertEquals(result.status, "rejected");
  if (result.status === "rejected") {
    assertEquals(result.error?.code, "VALIDATION_CHAT_TOO_LONG");
  }
  assertEquals(s.getState().messages.length, 0);
});

Deno.test("exactly-at-limit message is accepted", () => {
  const s = store();
  const result = sendChatMessage(s, "x".repeat(CHAT_MAX_LENGTH), "alice");
  assertEquals(result.status, "sent");
});

// 5b. Limits (scroll-back): over the store cap the oldest messages drop, newest kept.
Deno.test("sending beyond the store cap keeps only the newest messages", () => {
  const s = store(3);
  for (let i = 1; i <= 5; i++) {
    sendChatMessage(s, `m${i}`, "alice");
  }
  assertEquals(
    s.getState().messages.map((m) => m.text),
    ["m3", "m4", "m5"],
  );
});
