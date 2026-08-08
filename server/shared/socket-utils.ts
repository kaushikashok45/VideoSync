import type { Socket } from "socket.io";

export function currentRoom(socket: Socket): string | undefined {
  for (const name of socket.rooms) {
    if (name !== socket.id) return name;
  }
  return undefined;
}
