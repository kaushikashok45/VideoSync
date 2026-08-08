import { useSyncExternalStore } from "react";
import type { MembersStore } from "~/entities/member/members-store.ts";

export interface PresencePillProps {
  store: MembersStore;
}

export default function PresencePill({ store }: PresencePillProps) {
  const members = useSyncExternalStore(
    store.subscribe,
    () => store.getState().members,
  );
  if (members.length === 0) return null;
  return (
    <span
      data-testid="presence-pill"
      className="absolute bottom-md left-md rounded-full bg-surface/80 px-sm py-xxs text-xs font-semibold text-ink-muted backdrop-blur"
    >
      {members.length} watching
    </span>
  );
}
