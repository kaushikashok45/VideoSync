import { Users } from "lucide-react";
import { useSyncExternalStore } from "react";
import type { MembersStore } from "~/entities/member/members-store.ts";

export interface PresencePillProps {
  store: MembersStore;
}

export default function PresencePill({ store }: PresencePillProps) {
  const members = useSyncExternalStore(
    store.subscribe,
    () => store.getState().members,
    () => store.getState().members,
  );
  if (members.length === 0) return null;
  return (
    <span
      data-testid="presence-pill"
      role="status"
      aria-live="polite"
      className="absolute left-md top-md inline-flex items-center gap-xs rounded-full border border-line bg-surface-raised/85 px-sm py-xxs font-mono text-xs font-semibold text-ink shadow-pop backdrop-blur"
    >
      <Users aria-hidden="true" className="size-3.5" />
      <span>{members.length} watching now</span>
    </span>
  );
}
