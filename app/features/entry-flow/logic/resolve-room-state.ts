import {
  normalizeRoomCode,
  validateRoomCode,
} from "~/features/room-join/model/join-behaviour.ts";

export type RoomState =
  | { kind: "invalid"; recoveryLabel: "Return home" }
  | { kind: "ready"; roomId: string; source: "route" | "session" }
  | {
    kind: "mismatch";
    roomId: string;
    routeRoomId: string;
    sessionRoomId: string;
    recoveryLabel: "Use active room";
  };

function normalize(value: string | null | undefined): string | null {
  if (value == null) return null;
  const roomId = normalizeRoomCode(value);
  return validateRoomCode(roomId) === null ? roomId : null;
}

export function resolveRoomState(
  routeRoomId: string | null | undefined,
  sessionRoomId: string | null | undefined,
): RoomState {
  const hasRoute = routeRoomId != null && routeRoomId.trim() !== "";
  const route = normalize(routeRoomId);
  const session = normalize(sessionRoomId);

  if (hasRoute && route === null) {
    return { kind: "invalid", recoveryLabel: "Return home" };
  }
  if (route !== null && session !== null && route !== session) {
    return {
      kind: "mismatch",
      roomId: route,
      routeRoomId: route,
      sessionRoomId: session,
      recoveryLabel: "Use active room",
    };
  }
  if (route !== null) {
    return { kind: "ready", roomId: route, source: "route" };
  }
  if (session !== null) {
    return { kind: "ready", roomId: session, source: "session" };
  }
  return { kind: "invalid", recoveryLabel: "Return home" };
}
