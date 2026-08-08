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
  expireSender(senderId: string): void;
  expireAll(): void;
}

export type ReactionStore = StoreApi<ReactionState>;

type SetFn = ReactionStore["setState"];
type GetFn = ReactionStore["getState"];

interface ReactionActionCtx {
  set: SetFn;
  get: GetFn;
  maxConcurrent: number;
}

function capped(list: Reaction[], max: number): Reaction[] {
  if (list.length <= max) return list;
  return list.slice(list.length - max);
}

function sendAction(
  ctx: ReactionActionCtx,
  emoji: string,
  senderName: string,
): Reaction | undefined {
  const { set, get, maxConcurrent } = ctx;
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
}

function burstAction(
  set: SetFn,
  get: GetFn,
  maxConcurrent: number,
  r: Reaction,
): void {
  const { active } = get();
  set({ active: capped([...active, r], maxConcurrent) });
}

function expireSenderAction(set: SetFn, get: GetFn, senderId: string): void {
  const { active } = get();
  set({ active: active.filter((r) => r.senderId !== senderId) });
}

function expireAllAction(set: SetFn): void {
  set({ active: [] });
}

export function createReactionStore(
  deps: ReactionStoreDeps = {},
): ReactionStore {
  const maxConcurrent = deps.maxConcurrent ?? 12;
  return createStore<ReactionState>()((set, get) => ({
    active: [],
    send: (emoji, senderName) =>
      sendAction({ set, get, maxConcurrent }, emoji, senderName),
    burst: (r) => burstAction(set, get, maxConcurrent, r),
    expireSender: (senderId) => expireSenderAction(set, get, senderId),
    expireAll: () => expireAllAction(set),
  }));
}
