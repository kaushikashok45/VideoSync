import { assertEquals } from "@std/assert";
import type { Socket } from "socket.io";
import { currentRoom } from "./socket-utils.ts";

function fakeSocket(id: string, rooms: string[]) {
  return { id, rooms: new Set(rooms) } as unknown as Socket;
}

// Happy path
Deno.test("currentRoom returns the first non-self room name", () => {
  assertEquals(currentRoom(fakeSocket("sock-1", ["sock-1", "abcde"])), "abcde");
});

// Edge: only self in rooms -> undefined
Deno.test("currentRoom returns undefined when in no room", () => {
  assertEquals(currentRoom(fakeSocket("sock-1", ["sock-1"])), undefined);
});

// Edge: empty rooms -> undefined
Deno.test("currentRoom returns undefined for an empty rooms set", () => {
  assertEquals(currentRoom(fakeSocket("sock-1", [])), undefined);
});
