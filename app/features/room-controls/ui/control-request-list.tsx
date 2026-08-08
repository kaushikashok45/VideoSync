import { useSyncExternalStore } from "react";
import type { Member } from "contracts/member.ts";
import type { MembersStore } from "~/entities/member/members-store.ts";
import { Button } from "~/shared/ui-kit/index.ts";
import {
  approveControlRequest,
  denyControlRequest,
} from "../model/host-tools-behaviour.ts";

export interface ControlRequestListProps {
  me: Member;
  store: MembersStore;
}

export default function ControlRequestList({
  me,
  store,
}: ControlRequestListProps) {
  const requests = useSyncExternalStore(
    store.subscribe,
    () => store.getState().controlRequests,
    () => [],
  );
  if (requests.length === 0) return null;
  return (
    <section className="rounded-md border border-line bg-surface p-md">
      <h3 className="font-mono text-sm font-bold text-ink">
        Control requests
      </h3>
      {requests.map((request) => (
        <div
          key={request.id}
          className="mt-xs flex items-center justify-between gap-sm"
        >
          <span className="font-mono text-sm text-ink">{request.name}</span>
          <div className="flex gap-xs">
            <Button
              size="sm"
              onClick={() => approveControlRequest(store, me, request.id)}
            >
              Approve
            </Button>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => denyControlRequest(store, me, request.id)}
            >
              Deny
            </Button>
          </div>
        </div>
      ))}
    </section>
  );
}
