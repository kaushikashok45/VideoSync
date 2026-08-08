import { useState } from "react";
import { copyRoomCode } from "~/features/room-controls/model/host-tools-behaviour.ts";
import { Button } from "~/shared/ui-kit/index.ts";

export interface RoomCodeCopyProps {
  code: string;
}

export default function RoomCodeCopy({ code }: RoomCodeCopyProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const ok = await copyRoomCode(code);
    if (!ok) return;
    setCopied(true);
    globalThis.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="flex flex-col items-center gap-sm">
      <span
        data-testid="room-code"
        className="rounded-lg border border-line-strong bg-surface-raised px-lg py-sm font-mono text-3xl font-bold tracking-[0.35em] text-ink"
      >
        {code}
      </span>
      <Button variant="secondary" size="sm" onClick={copy}>
        {copied ? "Copied!" : "Copy code"}
      </Button>
    </div>
  );
}
