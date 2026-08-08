import { assertEquals } from "@std/assert";
import { createChatStore, LOCAL_SENDER_ID } from "./chat-store.ts";
import type { ChatMessage } from "contracts/chat-message.ts";

function msg(id: string, text = `t-${id}`): ChatMessage {
  return { id, senderId: "s-1", senderName: "alice", text, ts: 100_000 };
}

// Happy path: send appends a local message with generated fields
Deno.test("send appends a local message with generated fields", () => {
  const store = createChatStore({ maxMessages: 10 });
  const sent = store.getState().send("hello", "me");
  assertEquals(sent?.text, "hello");
  assertEquals(sent?.senderName, "me");
  assertEquals(sent?.senderId, LOCAL_SENDER_ID);
  assertEquals(typeof sent?.id, "string");
  assertEquals((sent?.id.length ?? 0) > 0, true);
  assertEquals(store.getState().messages.length, 1);
  assertEquals(store.getState().messages[0].text, "hello");
});

// Sad path: empty text is ignored
Deno.test("send ignores empty or whitespace-only text", () => {
  const store = createChatStore({ maxMessages: 10 });
  assertEquals(store.getState().send("", "me"), undefined);
  assertEquals(store.getState().send("   ", "me"), undefined);
  assertEquals(store.getState().messages.length, 0);
});

// Edge: append beyond the cap drops the oldest message
Deno.test("append drops the oldest message when over cap", () => {
  const store = createChatStore({ maxMessages: 2 });
  store.getState().append(msg("1"));
  store.getState().append(msg("2"));
  store.getState().append(msg("3"));
  assertEquals(store.getState().messages.map((m) => m.id), ["2", "3"]);
});

// Mutation: append preserves insertion order
Deno.test("append preserves insertion order", () => {
  const store = createChatStore({ maxMessages: 10 });
  store.getState().append(msg("1"));
  store.getState().append(msg("2"));
  store.getState().append(msg("3"));
  assertEquals(store.getState().messages.map((m) => m.id), ["1", "2", "3"]);
});

// Logical limits: exactly-at cap kept, just-beyond drops the oldest
Deno.test("cap keeps exactly maxMessages and drops the oldest beyond it", () => {
  const store = createChatStore({ maxMessages: 3 });
  store.getState().append(msg("1"));
  store.getState().append(msg("2"));
  store.getState().append(msg("3"));
  assertEquals(store.getState().messages.length, 3);
  assertEquals(store.getState().messages.map((m) => m.id), ["1", "2", "3"]);
  store.getState().append(msg("4"));
  assertEquals(store.getState().messages.length, 3);
  assertEquals(store.getState().messages.map((m) => m.id), ["2", "3", "4"]);
});

// Logical limits: default maxMessages is 200
Deno.test("default maxMessages is 200", () => {
  const store = createChatStore();
  for (let i = 0; i < 205; i++) {
    store.getState().append(msg(String(i)));
  }
  assertEquals(store.getState().messages.length, 200);
});
