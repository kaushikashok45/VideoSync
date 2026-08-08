import { assertEquals } from "@std/assert";
import generateRoomID from "./generateRoomID.ts";

Deno.test("generateRoomID returns a room id prefixed with VideoSync", () => {
  const roomId = generateRoomID();
  assertEquals(roomId.startsWith("VideoSync"), true);
});

Deno.test("generateRoomID returns unique ids", () => {
  const first = generateRoomID();
  const second = generateRoomID();
  assertEquals(first === second, false);
});
