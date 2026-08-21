import { assertEquals } from "@std/assert";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { io as ClientIO, type Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "../../../shared/contracts/socket-events.ts";
import { RoomStore } from "../../entities/room-store/room-store.ts";
import { RoomHandler } from "../room/room-handler.ts";
import { createLogger } from "../../shared/logger/logger.ts";
import { ReactionHandler } from "./reaction-handler.ts";

function silentLogger() {
  return createLogger({ level: "error", sink: () => {} });
}

async function makeHarness() {
  const httpServer: Server = createServer();
  const io = new SocketIOServer(httpServer, { cors: { origin: "*" } });
  const rooms = new RoomStore({
    maxMembers: 15,
    now: () => Date.now(),
    codeLength: 5,
  });
  new RoomHandler({ io, rooms, logger: silentLogger() }).attach();
  new ReactionHandler({ io, logger: silentLogger() }).attach();
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const addr = httpServer.address() as { port: number };
  const url = `http://localhost:${addr.port}`;

  function connect(): Promise<Socket> {
    return new Promise((resolve) => {
      const client: Socket = ClientIO(url, {
        transports: ["websocket", "polling"],
      });
      client.on("connect", () => resolve(client));
    });
  }

  function waitFor<T>(socket: Socket, event: string): Promise<T> {
    return new Promise((resolve) => socket.once(event, resolve));
  }

  async function joinPair() {
    const host = await connect();
    const createdP = waitFor<{ room: { code: string } }>(
      host,
      SOCKET_EVENTS.ROOM_CREATED,
    );
    host.emit(SOCKET_EVENTS.ROOM_CREATE, { name: "Alice" });
    const { room } = await createdP;
    const viewer = await connect();
    const joinedP = waitFor<Record<string, unknown>>(
      viewer,
      SOCKET_EVENTS.ROOM_JOINED,
    );
    viewer.emit(SOCKET_EVENTS.ROOM_JOIN, { code: room.code, name: "Bob" });
    await joinedP;
    return { host, viewer };
  }

  return { io, httpServer, connect, waitFor, joinPair };
}

// Happy path
Deno.test("reaction is relayed to the room", async () => {
  const h = await makeHarness();
  try {
    const { host, viewer } = await h.joinPair();
    const reactionP = h.waitFor<{ emoji: string; senderName: string }>(
      host,
      SOCKET_EVENTS.REACTION,
    );
    viewer.emit(SOCKET_EVENTS.REACTION_SEND, {
      emoji: "🔥",
      senderName: "Bob",
    });
    const reaction = await reactionP;
    assertEquals(reaction.emoji, "🔥");
    assertEquals(reaction.senderName, "Bob");
    host.disconnect();
    viewer.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(() => r()));
  }
});

// Sad path: disallowed emoji is ignored
Deno.test("disallowed emoji is ignored", async () => {
  const h = await makeHarness();
  try {
    const { host, viewer } = await h.joinPair();
    let emitted = false;
    host.on(SOCKET_EVENTS.REACTION, () => {
      emitted = true;
    });
    viewer.emit(SOCKET_EVENTS.REACTION_SEND, {
      emoji: "🦄",
      senderName: "Bob",
    });
    await new Promise((r) => setTimeout(r, 200));
    assertEquals(emitted, false);
    host.disconnect();
    viewer.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(() => r()));
  }
});

// Edge: missing emoji is ignored
Deno.test("missing emoji is ignored", async () => {
  const h = await makeHarness();
  try {
    const { host, viewer } = await h.joinPair();
    let emitted = false;
    host.on(SOCKET_EVENTS.REACTION, () => {
      emitted = true;
    });
    viewer.emit(SOCKET_EVENTS.REACTION_SEND, {
      emoji: undefined,
      senderName: "Bob",
    });
    await new Promise((r) => setTimeout(r, 200));
    assertEquals(emitted, false);
    host.disconnect();
    viewer.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(() => r()));
  }
});

// Room isolation (ROOM-INV-11 / REACTION-INV-5): a reaction reaches no member outside the sender's room
Deno.test("reaction in one room reaches no member of another room", async () => {
  const h = await makeHarness();
  try {
    const roomA = await h.joinPair();
    const roomB = await h.joinPair();

    let roomBHostReceived = false;
    let roomBViewerReceived = false;
    roomB.host.on(SOCKET_EVENTS.REACTION, () => {
      roomBHostReceived = true;
    });
    roomB.viewer.on(SOCKET_EVENTS.REACTION, () => {
      roomBViewerReceived = true;
    });

    const reactionOnAHost = h.waitFor<{ emoji: string }>(
      roomA.host,
      SOCKET_EVENTS.REACTION,
    );
    roomA.viewer.emit(SOCKET_EVENTS.REACTION_SEND, {
      emoji: "🔥",
      senderName: "Bob",
    });
    const reaction = await reactionOnAHost;
    assertEquals(reaction.emoji, "🔥");

    await new Promise((r) => setTimeout(r, 200));
    assertEquals(roomBHostReceived, false);
    assertEquals(roomBViewerReceived, false);

    roomA.host.disconnect();
    roomA.viewer.disconnect();
    roomB.host.disconnect();
    roomB.viewer.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(() => r()));
  }
});

// Edge: reaction before joining is dropped
Deno.test("reaction before joining is dropped", async () => {
  const h = await makeHarness();
  try {
    const { host } = await h.joinPair();
    const stray = await h.connect();
    let emitted = false;
    host.on(SOCKET_EVENTS.REACTION, () => {
      emitted = true;
    });
    stray.emit(SOCKET_EVENTS.REACTION_SEND, { emoji: "🔥", senderName: "L" });
    await new Promise((r) => setTimeout(r, 200));
    assertEquals(emitted, false);
    host.disconnect();
    stray.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(() => r()));
  }
});
