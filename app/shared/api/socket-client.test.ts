import { assertEquals } from "@std/assert";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { createSocketClient } from "./socket-client.ts";
import { RoomHandler } from "../../../server/features/room/room-handler.ts";
import { RoomStore } from "../../../server/entities/room-store/room-store.ts";
import { createLogger } from "../../../server/shared/logger/logger.ts";

function silentLogger() {
  return createLogger({ level: "error", sink: () => {} });
}

// Happy path
Deno.test("createSocketClient creates a room and returns its code", async () => {
  const httpServer: Server = createServer();
  const io = new SocketIOServer(httpServer, { cors: { origin: "*" } });
  const rooms = new RoomStore({
    maxMembers: 15,
    now: () => Date.now(),
    codeLength: 5,
  });
  new RoomHandler({ io, rooms, logger: silentLogger() }).attach();
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const addr = httpServer.address() as { port: number };
  const url = `http://localhost:${addr.port}`;

  try {
    const client = createSocketClient({ url });
    const room = await client.createRoom("Alice");
    assertEquals(typeof room.code, "string");
    client.disconnect();
  } finally {
    io.close();
    await new Promise<void>((r) => httpServer.close(() => r()));
  }
});

// Sad path: createRoom with an empty name surfaces a typed AppError
Deno.test("createSocketClient surfaces AppError for an empty name", async () => {
  const httpServer: Server = createServer();
  const io = new SocketIOServer(httpServer, { cors: { origin: "*" } });
  const rooms = new RoomStore({
    maxMembers: 15,
    now: () => Date.now(),
    codeLength: 5,
  });
  new RoomHandler({ io, rooms, logger: silentLogger() }).attach();
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const addr = httpServer.address() as { port: number };
  const url = `http://localhost:${addr.port}`;

  try {
    const client = createSocketClient({ url });
    let caught: { code: string } | undefined;
    try {
      await client.createRoom("   ");
    } catch (err) {
      caught = err as { code: string };
    }
    assertEquals(caught?.code, "VALIDATION_NAME_EMPTY");
    client.disconnect();
  } finally {
    io.close();
    await new Promise<void>((r) => httpServer.close(() => r()));
  }
});
