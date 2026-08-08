import type { Member } from "contracts/member.ts";
import { Avatar, Badge } from "~/shared/ui-kit/index.ts";

export interface MemberListProps {
  members: Member[];
}

export default function MemberList({ members }: MemberListProps) {
  return (
    <ul data-testid="member-list" className="flex flex-col gap-xs">
      {members.map((member) => (
        <li
          key={member.id}
          data-testid="member-row"
          className="flex items-center gap-sm rounded-md bg-surface px-sm py-xs"
        >
          <Avatar name={member.name} size="sm" />
          <span className="flex-1 font-mono text-sm text-ink">
            {member.name}
          </span>
          {member.role === "host" ? <Badge variant="brand">Host</Badge> : null}
          {member.canControl ? <Badge variant="success">controls</Badge> : null}
        </li>
      ))}
    </ul>
  );
}
