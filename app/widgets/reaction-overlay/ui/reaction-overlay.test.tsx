import { assertEquals } from "@std/assert";
import { act } from "react";
import type { Member } from "contracts/member.ts";
import type { Reaction } from "contracts/reaction.ts";
import { createMembersStore } from "~/entities/member/members-store.ts";
import { createReactionStore } from "~/entities/reaction/reaction-store.ts";
import { render, setupDom } from "~/shared/ui-kit/render-helper.ts";
import ReactionOverlay from "./reaction-overlay.tsx";

function reaction(senderId: string, emoji: string, ts: number): Reaction {
  return { senderId, senderName: `name-${senderId}`, emoji, ts };
}

function floats(container: HTMLElement): NodeListOf<Element> {
  return container.querySelectorAll('[data-testid="reaction-float"]');
}

function flush(ms: number): Promise<void> {
  return act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });
}

// 1. Happy: active reactions render as floats.
Deno.test("renders a float per active reaction", () => {
  setupDom();
  const store = createReactionStore();
  const { container } = render(<ReactionOverlay reactionStore={store} />);
  act(() => {
    store.getState().burst(reaction("a", "👍", 1));
    store.getState().burst(reaction("b", "🔥", 2));
  });
  assertEquals(floats(container).length, 2);
});

// 2. Sad/Edge: empty active renders nothing (overlay returns null).
Deno.test("renders nothing when no reactions are active", () => {
  setupDom();
  const store = createReactionStore();
  const { container } = render(<ReactionOverlay reactionStore={store} />);
  assertEquals(
    container.querySelector('[data-testid="reaction-overlay"]'),
    null,
  );
  assertEquals(floats(container).length, 0);
});

// 3. Mutation: a reaction in active must have a matching float.
Deno.test("each active reaction renders a float with its emoji", () => {
  setupDom();
  const store = createReactionStore();
  const { container } = render(<ReactionOverlay reactionStore={store} />);
  act(() => store.getState().burst(reaction("a", "❤️", 1)));
  assertEquals(
    container.querySelector('[data-reaction-emoji="❤️"]') !== null,
    true,
  );
  assertEquals(floats(container).length, store.getState().active.length);
});

// 3b. Mutation: capped active renders exactly N floats.
Deno.test("capped active renders exactly the capped count", () => {
  setupDom();
  const store = createReactionStore({ maxConcurrent: 12 });
  const { container } = render(<ReactionOverlay reactionStore={store} />);
  act(() => {
    for (let i = 0; i < 15; i++) {
      store.getState().burst(reaction(`s-${i}`, "👍", i));
    }
  });
  assertEquals(floats(container).length, 12);
});

// 4. Limits: x-position stays within the horizontal bounds.
Deno.test("floats are positioned within the horizontal bounds", () => {
  setupDom();
  const store = createReactionStore();
  const { container } = render(<ReactionOverlay reactionStore={store} />);
  act(() => store.getState().burst(reaction("a", "👍", 1)));
  const float = floats(container)[0] as HTMLElement;
  const left = parseFloat(float.style.left);
  assertEquals(Number.isNaN(left), false);
  assertEquals(left >= 0 && left <= 100, true);
});

// 4b. Limits: expiry removes the float after expireMs.
Deno.test("expiry removes the float after expireMs", async () => {
  setupDom();
  const store = createReactionStore();
  const { container } = render(
    <ReactionOverlay reactionStore={store} expireMs={5} />,
  );
  act(() => store.getState().burst(reaction("a", "👍", 1)));
  assertEquals(floats(container).length, 1);
  await flush(30);
  assertEquals(floats(container).length, 0);
});

// 5. Edge: presence pill reflects the member count.
Deno.test("presence pill shows the member count", () => {
  setupDom();
  const members = createMembersStore();
  const membersList: Member[] = [
    { id: "a", name: "A", role: "host", canControl: true, joinedAt: 0 },
    { id: "b", name: "B", role: "viewer", canControl: false, joinedAt: 1 },
  ];
  members.getState().setMembers(membersList, "a");
  const store = createReactionStore();
  const { container } = render(
    <ReactionOverlay reactionStore={store} membersStore={members} />,
  );
  const pill = container.querySelector('[data-testid="presence-pill"]');
  assertEquals(pill !== null, true);
  assertEquals(pill?.textContent?.includes("2"), true);
});
