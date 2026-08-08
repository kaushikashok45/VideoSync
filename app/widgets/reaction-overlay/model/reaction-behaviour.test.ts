import { assert, assertEquals } from "@std/assert";
import type { Reaction } from "contracts/reaction.ts";
import { REACTION_EMOJIS } from "contracts/reaction-emojis.ts";
import {
  createReactionStore,
  LOCAL_SENDER_ID,
} from "~/entities/reaction/reaction-store.ts";
import {
  burstReaction,
  expireReaction,
  randomX,
  REACTION_X_MAX,
  REACTION_X_MIN,
  sendReaction,
} from "./reaction-behaviour.ts";

function reaction(senderId: string, emoji = "👍", ts = 100_000): Reaction {
  return { senderId, senderName: `name-${senderId}`, emoji, ts };
}

// 1. Happy: send adds an allowed reaction; expiry removes it.
Deno.test("sendReaction adds an allowed reaction with the sender name", () => {
  const store = createReactionStore();
  const sent = sendReaction("🔥", "me", store);
  assertEquals(sent?.emoji, "🔥");
  assertEquals(sent?.senderName, "me");
  assertEquals(store.getState().active.length, 1);
});

Deno.test("expireReaction removes a reaction the user sent", () => {
  const store = createReactionStore();
  const sent = sendReaction("👍", "me", store);
  if (!sent) throw new Error("send failed");
  expireReaction(LOCAL_SENDER_ID, sent.ts, store);
  assertEquals(store.getState().active.length, 0);
});

// 2. Sad: empty and non-allowed emojis are rejected.
Deno.test("sendReaction rejects empty and non-allowed emojis", () => {
  const store = createReactionStore();
  assertEquals(sendReaction("", "me", store), undefined);
  assertEquals(sendReaction("   ", "me", store), undefined);
  assertEquals(sendReaction("🦄", "me", store), undefined);
  assertEquals(store.getState().active.length, 0);
});

// 3. Edge: cap at maxConcurrent exactly and beyond drops the oldest.
Deno.test("sendReaction caps at maxConcurrent and keeps the newest", () => {
  const store = createReactionStore({ maxConcurrent: 12 });
  for (let i = 0; i < 12; i++) {
    sendReaction(REACTION_EMOJIS[i % REACTION_EMOJIS.length], `n${i}`, store);
  }
  assertEquals(store.getState().active.length, 12);
  sendReaction("🔥", "n13", store);
  const active = store.getState().active;
  assertEquals(active.length, 12);
  assertEquals(active[active.length - 1].senderName, "n13");
});

// 4. Mutation: bursts are appended, not deduped; expiry targets one sender.
Deno.test("burstReaction appends duplicates without dedupe", () => {
  const store = createReactionStore();
  burstReaction(reaction("a", "👍"), store);
  burstReaction(reaction("a", "👍"), store);
  assertEquals(store.getState().active.length, 2);
});

Deno.test("expireReaction removes only the matching sender and ts", () => {
  const store = createReactionStore();
  burstReaction(reaction("a", "👍", 1), store);
  burstReaction(reaction("b", "🔥", 2), store);
  burstReaction(reaction("a", "❤️", 3), store);
  expireReaction("a", 1, store);
  assertEquals(store.getState().active.map((r) => r.ts), [2, 3]);
});

Deno.test("expireReaction does not remove same-sender reactions with other ts", () => {
  const store = createReactionStore();
  burstReaction(reaction("a", "👍", 1), store);
  burstReaction(reaction("a", "🔥", 2), store);
  expireReaction("a", 1, store);
  const active = store.getState().active;
  assertEquals(active.length, 1);
  assertEquals(active[0].ts, 2);
});

// 5. Limits: burst floods stay capped; positions stay in bounds.
Deno.test("burst flood stays capped", () => {
  const store = createReactionStore({ maxConcurrent: 12 });
  for (let i = 0; i < 30; i++) burstReaction(reaction(`s-${i}`), store);
  assertEquals(store.getState().active.length, 12);
});

Deno.test("randomX stays within the float bounds", () => {
  for (let i = 0; i < 500; i++) {
    const x = randomX();
    assert(x >= REACTION_X_MIN && x <= REACTION_X_MAX);
  }
});
