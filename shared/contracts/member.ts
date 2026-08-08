export type MemberRole = "host" | "viewer";

export interface Member {
  id: string;
  name: string;
  role: MemberRole;
  canControl: boolean;
  joinedAt: number;
}
