import { normalizeRoomCode, validateRoomCode } from "./join-behaviour.ts";

export type RoomIdentitySource = "route" | "session";
export type RoomIdentityStatus = "resolved" | "mismatch";

export interface RoomIdentityRecovery {
  kind: "sync-session";
  roomId: string;
}

export interface RoomIdentityResolution {
  roomId: string;
  source: RoomIdentitySource;
  status: RoomIdentityStatus;
  recovery?: RoomIdentityRecovery;
}

function resolveRoomCode(value: string | null | undefined): string | null {
  if (value == null) return null;
  const normalized = normalizeRoomCode(value);
  return validateRoomCode(normalized) === null ? normalized : null;
}

export function resolveCanonicalRoomIdentity(
  routeRoomId: string | null | undefined,
  sessionRoomId: string | null | undefined,
): RoomIdentityResolution | null {
  const route = resolveRoomCode(routeRoomId);
  const session = resolveRoomCode(sessionRoomId);

  if (route !== null && session !== null) {
    if (route === session) {
      return { roomId: route, source: "route", status: "resolved" };
    }

    return {
      roomId: route,
      source: "route",
      status: "mismatch",
      recovery: { kind: "sync-session", roomId: route },
    };
  }

  if (route !== null) {
    return { roomId: route, source: "route", status: "resolved" };
  }

  if (session !== null) {
    return { roomId: session, source: "session", status: "resolved" };
  }

  return null;
}
