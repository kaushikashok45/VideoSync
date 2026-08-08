import { createStore, type StoreApi } from "zustand/vanilla";
import type { Reaction } from "contracts/reaction.ts";

export const LOCAL_SENDER_ID = "local";

export interface ReactionStoreDeps {
  maxConcurrent?: number;
}

export interface ReactionState {
  active: Reaction[];
  send(emoji: string, senderName: string): Reaction | undefined;
  burst(r: Reaction): void;
  expire(id: string): void;
  expireAll(): void;
}

export type ReactionStore = StoreApi<ReactionState>;

function capped(list: Reaction[], max: number): Reaction[] {
  if (list.length <= max) return list;
  return list.slice(list.length - max);
}

export function createReactionStore(
  deps: ReactionStoreDeps = {},
): ReactionStore {
  const maxConcurrent = deps.maxConcurrent ?? 12;
  return createStore<ReactionState>()((set, get) => ({
    active: [],
    send(emoji, senderName) {
      if (emoji.trim() === "") return undefined;
      const reaction: Reaction = {
        senderId: LOCAL_SENDER_ID,
        senderName,
        emoji,
        ts: Date.now(),
      };
      const { active } = get();
      set({ active: capped([...active, reaction], maxConcurrent) });
      return reaction;
    },
    burst(r) {
      const { active } = get();
      set({ active: capped([...active, r], maxConcurrent) });
    },
    expire(id) {
      const { active } = get();
      set({ active: active.filter((r) => r.senderId !== id) });
    },
    expireAll() {
      set({ active: [] });
    },
  }));
}
