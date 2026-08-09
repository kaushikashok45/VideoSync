import { useState } from "react";
import { Badge, Button } from "~/shared/ui-kit/index.ts";
import { copyRoomCode } from "~/features/room-controls/model/host-tools-behaviour.ts";

export interface RoomIdentityCardProps {
  roomId: string;
}

function inviteLink(roomId: string): string {
  if (typeof globalThis.location === "undefined") {
    return `/${roomId}/SetupScreen`;
  }
  return `${globalThis.location.origin}/${roomId}/SetupScreen`;
}

export function RoomIdentityCard({ roomId }: RoomIdentityCardProps) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  const copy = async (kind: "code" | "link") => {
    const text = kind === "code" ? roomId : inviteLink(roomId);
    if (!await copyRoomCode(text)) return;
    setCopied(kind);
    globalThis.setTimeout(() => setCopied(null), 1600);
  };

  return (
    <section className="flex flex-col gap-md border-t border-line-strong pt-lg">
      <div className="flex items-center justify-between gap-sm">
        <Badge>Active room</Badge>
        <span className="font-mono text-sm text-ink-faint">
          Invite your people
        </span>
      </div>
      <div className="border border-line-strong bg-surface-raised px-lg py-md font-mono text-2xl font-bold tracking-[0.26em] text-ink md:text-3xl">
        {roomId}
      </div>
      <div className="flex flex-wrap gap-sm">
        <Button variant="secondary" size="sm" onClick={() => void copy("code")}>
          {copied === "code" ? "Code copied" : "Copy room code"}
        </Button>
        <Button variant="ghost" size="sm" onClick={() => void copy("link")}>
          {copied === "link" ? "Invite copied" : "Copy invite link"}
        </Button>
      </div>
    </section>
  );
}
