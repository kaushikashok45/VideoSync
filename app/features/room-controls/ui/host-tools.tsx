import type { Member } from "contracts/member.ts";
import type { MembersStore } from "~/entities/member/members-store.ts";
import { Button } from "~/shared/ui-kit/index.ts";
import { copyRoomCode } from "../model/host-tools-behaviour.ts";

export interface HostToolsProps {
  me: Member;
  roomId: string;
  store: MembersStore;
}

export default function HostTools({ roomId }: HostToolsProps) {
  const copyCode = async () => {
    await copyRoomCode(roomId);
  };
  return (
    <div data-testid="host-tools" className="flex flex-col gap-md">
      <section className="rounded-md border border-line bg-surface p-md">
        <h3 className="font-mono text-sm font-bold text-ink">Room</h3>
        <div className="mt-sm flex items-center justify-between gap-sm">
          <span className="font-mono text-sm text-ink-muted">Code</span>
          <div className="flex items-center gap-xs">
            <span className="font-mono text-sm font-semibold tracking-widest text-ink">
              {roomId}
            </span>
            <Button size="sm" variant="secondary" onClick={copyCode}>
              Copy
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
