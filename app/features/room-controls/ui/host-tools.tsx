import { useState } from "react";
import type { ReactNode } from "react";
import type { Member } from "contracts/member.ts";
import type { MembersStore } from "~/entities/member/members-store.ts";
import { Button, Modal, Switch } from "~/shared/ui-kit/index.ts";
import {
  copyRoomCode,
  nextLockState,
  toggleEveryoneControl,
} from "../model/host-tools-behaviour.ts";
import ControlRequestList from "./control-request-list.tsx";
import MemberControlList from "./member-control-list.tsx";

export interface HostToolsProps {
  me: Member;
  roomId: string;
  store: MembersStore;
}

function SettingRow(
  { label, children }: { label: string; children: ReactNode },
) {
  return (
    <div className="mt-sm flex items-center justify-between gap-sm">
      <span className="font-mono text-sm text-ink-muted">{label}</span>
      {children}
    </div>
  );
}

export default function HostTools({ me, roomId, store }: HostToolsProps) {
  const [locked, setLocked] = useState(false);
  const [everyoneOn, setEveryoneOn] = useState(false);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [copied, setCopied] = useState(false);
  const copyCode = async () => {
    setCopied(await copyRoomCode(roomId));
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
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
        </div>
        <SettingRow label="Lock room">
          <Switch
            checked={locked}
            onChange={() => setLocked(nextLockState(locked))}
            aria-label="Lock room"
          />
        </SettingRow>
        <SettingRow label="Everyone can control">
          <Switch
            checked={everyoneOn}
            onChange={() => {
              setEveryoneOn(!everyoneOn);
              toggleEveryoneControl(store, me);
            }}
            aria-label="Everyone can control"
          />
        </SettingRow>
      </section>
      <MemberControlList me={me} store={store} />
      <ControlRequestList me={me} store={store} />
      <Button
        variant="secondary"
        className="text-status-danger"
        onClick={() => setConfirmEnd(true)}
      >
        End party
      </Button>
      <Modal
        open={confirmEnd}
        title="End the party?"
        onClose={() => setConfirmEnd(false)}
      >
        <p className="font-mono text-sm text-ink-muted">
          Everyone will be disconnected and the room closed.
        </p>
        <div className="mt-md flex justify-end gap-sm">
          <Button variant="secondary" onClick={() => setConfirmEnd(false)}>
            Keep watching
          </Button>
          <Button
            data-testid="confirm-end-party"
            onClick={() => setConfirmEnd(false)}
          >
            End party
          </Button>
        </div>
      </Modal>
    </div>
  );
}
