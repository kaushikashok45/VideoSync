import type { Reaction } from "contracts/reaction.ts";
import { REACTION_EMOJIS } from "contracts/reaction-emojis.ts";
import type { ReactionStore } from "~/entities/reaction/reaction-store.ts";

export const REACTION_X_MIN = 8;
export const REACTION_X_MAX = 84;

export function isAllowedReaction(emoji: string): boolean {
  return REACTION_EMOJIS.includes(emoji);
}

export function sendReaction(
  emoji: string,
  senderName: string,
  store: ReactionStore,
): Reaction | undefined {
  if (!isAllowedReaction(emoji)) return undefined;
  return store.getState().send(emoji, senderName);
}

export function burstReaction(r: Reaction, store: ReactionStore): void {
  store.getState().burst(r);
}

export function expireReaction(
  senderId: string,
  ts: number,
  store: ReactionStore,
): void {
  store.getState().expireReaction(senderId, ts);
}

export function expireSender(senderId: string, store: ReactionStore): void {
  store.getState().expireSender(senderId);
}

export function randomX(min = REACTION_X_MIN, max = REACTION_X_MAX): number {
  return Math.round(min + Math.random() * (max - min));
}
