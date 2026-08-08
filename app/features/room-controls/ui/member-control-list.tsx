import { useSyncExternalStore } from "react";
import type { Member } from "contracts/member.ts";
import type { MembersStore } from "~/entities/member/members-store.ts";
import { Switch } from "~/shared/ui-kit/index.ts";
import {
  grantMemberControl,
  revokeMemberControl,
} from "../model/host-tools-behaviour.ts";

export interface MemberControlListProps {
  me: Member;
  store: MembersStore;
}

export default function MemberControlList({
  me,
  store,
}: MemberControlListProps) {
  const members = useSyncExternalStore(
    store.subscribe,
    () => store.getState().members,
  );
  const viewers = members.filter((member) => member.role !== "host");
  if (viewers.length === 0) return null;
  const toggle = (id: string, canControl: boolean) => {
    if (canControl) revokeMemberControl(store, me, id);
    else grantMemberControl(store, me, id);
  };
  return (
    <section className="rounded-md border border-line bg-surface p-md">
      <h3 className="font-mono text-sm font-bold text-ink">Member control</h3>
      {viewers.map((member) => (
        <div
          key={member.id}
          className="mt-xs flex items-center justify-between gap-sm"
        >
          <span className="font-mono text-sm text-ink">{member.name}</span>
          <Switch
            checked={member.canControl}
            onChange={(next) => toggle(member.id, next)}
            aria-label={`Control for ${member.name}`}
          />
        </div>
      ))}
    </section>
  );
}
