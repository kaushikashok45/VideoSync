import { useEffect, useRef, useSyncExternalStore } from "react";
import type { MembersStore } from "~/entities/member/members-store.ts";
import type { ReactionStore } from "~/entities/reaction/reaction-store.ts";
import { expireReaction, randomX } from "../model/reaction-behaviour.ts";
import PresencePill from "./presence-pill.tsx";
import ReactionFloat from "./reaction-float.tsx";

export interface ReactionOverlayProps {
  reactionStore: ReactionStore;
  membersStore?: MembersStore;
  expireMs?: number;
}

const DEFAULT_EXPIRE_MS = 2400;

type TimerId = ReturnType<typeof setTimeout>;

export default function ReactionOverlay({
  reactionStore,
  membersStore,
  expireMs = DEFAULT_EXPIRE_MS,
}: ReactionOverlayProps) {
  const active = useSyncExternalStore(
    reactionStore.subscribe,
    () => reactionStore.getState().active,
  );
  const timersRef = useRef(new Map<string, TimerId>());
  useEffect(() => {
    const timers = timersRef.current;
    for (const reaction of active) {
      const key = `${reaction.senderId}:${reaction.ts}`;
      if (timers.has(key)) continue;
      const timer = setTimeout(() => {
        timers.delete(key);
        expireReaction(reaction.senderId, reaction.ts, reactionStore);
      }, expireMs);
      timers.set(key, timer);
    }
  }, [active, reactionStore, expireMs]);
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const timer of timers.values()) clearTimeout(timer);
      timers.clear();
    };
  }, []);
  if (active.length === 0 && !membersStore) return null;
  return (
    <div
      data-testid="reaction-overlay"
      className="pointer-events-none absolute inset-0 z-overlay overflow-hidden"
    >
      {membersStore ? <PresencePill store={membersStore} /> : null}
      {active.map((reaction) => (
        <ReactionFloat
          key={`${reaction.senderId}:${reaction.ts}`}
          emoji={reaction.emoji}
          x={randomX()}
        />
      ))}
    </div>
  );
}
