import Role from "~/context/Session/contracts/Role.ts";
import { validateName } from "./join-behaviour.ts";

export type JoinPathKind = "host" | "join";

export interface JoinPathResult {
  path: JoinPathKind;
  target: string;
}

export function isHost(role: Role): boolean {
  return role === Role.HOST;
}

export function hostTarget(roomId: string): string {
  return `/${roomId}/file-upload`;
}

export function joinTarget(roomId: string): string {
  return `/${roomId}/RecieverVideoPlayerNew`;
}

export function decideJoinPath(
  role: Role,
  roomId: string,
  name: string,
): JoinPathResult | null {
  if (validateName(name) !== null) return null;
  if (isHost(role)) return { path: "host", target: hostTarget(roomId) };
  return { path: "join", target: joinTarget(roomId) };
}
