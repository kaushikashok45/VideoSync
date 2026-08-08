import { assertEquals } from "@std/assert";
import { createReactionStore, LOCAL_SENDER_ID } from "./reaction-store.ts";
import type { Reaction } from "contracts/reaction.ts";

function reaction(senderId: string, emoji = "👍"): Reaction {
  return { senderId, senderName: `name-${senderId}`, emoji, ts: 100_000 };
}

// Happy path: send adds a local reaction
Deno.test("send adds a local reaction", () => {
  const store = createReactionStore({ maxConcurrent: 12 });
  const sent = store.getState().send("🔥", "me");
  assertEquals(sent?.emoji, "🔥");
  assertEquals(sent?.senderId, LOCAL_SENDER_ID);
  assertEquals(store.getState().active.length, 1);
});

// Sad path: empty emoji is ignored
Deno.test("send ignores an empty emoji", () => {
  const store = createReactionStore({ maxConcurrent: 12 });
  assertEquals(store.getState().send("", "me"), undefined);
  assertEquals(store.getState().send("   ", "me"), undefined);
  assertEquals(store.getState().active.length, 0);
});

// Edge: burst over the cap drops the oldest reaction
Deno.test("burst drops the oldest reaction when over cap", () => {
  const store = createReactionStore({ maxConcurrent: 2 });
  store.getState().burst(reaction("a", "👍"));
  store.getState().burst(reaction("b", "🔥"));
  store.getState().burst(reaction("c", "❤️"));
  assertEquals(store.getState().active.map((r) => r.senderId), ["b", "c"]);
});

// Mutation: expire removes only the matching sender
Deno.test("expire removes only the matching sender's reactions", () => {
  const store = createReactionStore({ maxConcurrent: 12 });
  store.getState().burst(reaction("a", "👍"));
  store.getState().burst(reaction("b", "🔥"));
  store.getState().burst(reaction("a", "❤️"));
  store.getState().expire("a");
  assertEquals(store.getState().active.map((r) => r.senderId), ["b"]);
});

// Mutation: expireAll clears every active reaction
Deno.test("expireAll clears all active reactions", () => {
  const store = createReactionStore({ maxConcurrent: 12 });
  store.getState().burst(reaction("a"));
  store.getState().burst(reaction("b"));
  store.getState().expireAll();
  assertEquals(store.getState().active.length, 0);
});

// Logical limits: exactly-at cap kept, just-beyond drops the oldest
Deno.test("cap keeps exactly maxConcurrent and drops the oldest beyond it", () => {
  const store = createReactionStore({ maxConcurrent: 3 });
  store.getState().burst(reaction("a"));
  store.getState().burst(reaction("b"));
  store.getState().burst(reaction("c"));
  assertEquals(store.getState().active.length, 3);
  store.getState().burst(reaction("d"));
  assertEquals(store.getState().active.length, 3);
  assertEquals(store.getState().active.map((r) => r.senderId), ["b", "c", "d"]);
});

// Logical limits: default maxConcurrent is 12
Deno.test("default maxConcurrent is 12", () => {
  const store = createReactionStore();
  for (let i = 0; i < 15; i++) {
    store.getState().burst(reaction(`s-${i}`));
  }
  assertEquals(store.getState().active.length, 12);
});
