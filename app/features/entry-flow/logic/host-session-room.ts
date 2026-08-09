const HOST_SESSION_ROOM_KEY = "entry-flow.host-room";

export function readHostSessionRoom(): string | null {
  if (typeof globalThis.sessionStorage === "undefined") return null;
  return globalThis.sessionStorage.getItem(HOST_SESSION_ROOM_KEY);
}

export function writeHostSessionRoom(roomId: string): void {
  if (typeof globalThis.sessionStorage === "undefined") return;
  globalThis.sessionStorage.setItem(HOST_SESSION_ROOM_KEY, roomId);
}
