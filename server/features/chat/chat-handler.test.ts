import { assertEquals } from "@std/assert";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { io as ClientIO, type Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "../../../shared/contracts/socket-events.ts";
import { RoomStore } from "../../entities/room-store/room-store.ts";
import { RoomHandler } from "../room/room-handler.ts";
import { createLogger } from "../../shared/logger/logger.ts";
import { ChatHandler } from "./chat-handler.ts";

function silentLogger() {
  return createLogger({ level: "error", sink: () => {} });
}

async function makeHarness(
  opts: {
    messagesPerWindow?: number;
    windowMs?: number;
    maxMessageLength?: number;
  } = {},
) {
  const httpServer: Server = createServer();
  const io = new SocketIOServer(httpServer, { cors: { origin: "*" } });
  const rooms = new RoomStore({
    maxMembers: 15,
    now: () => Date.now(),
    codeLength: 5,
  });
  new RoomHandler({ io, rooms, logger: silentLogger() }).attach();
  new ChatHandler({
    io,
    logger: silentLogger(),
    maxMessageLength: opts.maxMessageLength ?? 500,
    messagesPerWindow: opts.messagesPerWindow ?? 5,
    windowMs: opts.windowMs ?? 2000,
  }).attach();
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
    return { host, viewer, code: room.code };
  }

  return { io, httpServer, connect, waitFor, joinPair };
}

// Happy path
Deno.test("chat message is relayed to the room with sender metadata", async () => {
  const h = await makeHarness();
  try {
    const { host, viewer } = await h.joinPair();
    const msgOnHost = h.waitFor<{ text: string; senderName: string }>(
      host,
      SOCKET_EVENTS.CHAT_MESSAGE,
    );
    viewer.emit(SOCKET_EVENTS.CHAT_SEND, {
      text: "hi everyone",
      senderName: "Bob",
    });
    const msg = await msgOnHost;
    assertEquals(msg.text, "hi everyone");
    assertEquals(msg.senderName, "Bob");
    host.disconnect();
    viewer.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(() => r()));
  }
});

// Sad path: empty message is ignored
Deno.test("empty chat message is ignored", async () => {
  const h = await makeHarness();
  try {
    const { host, viewer } = await h.joinPair();
    let emitted = false;
    host.on(SOCKET_EVENTS.CHAT_MESSAGE, () => {
      emitted = true;
    });
    viewer.emit(SOCKET_EVENTS.CHAT_SEND, { text: "   ", senderName: "Bob" });
    await new Promise((r) => setTimeout(r, 200));
    assertEquals(emitted, false);
    host.disconnect();
    viewer.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(() => r()));
  }
});

// Logical limit: exactly-at-max-length allowed, just-beyond rejected
Deno.test("oversized chat message is rejected with a typed error", async () => {
  const h = await makeHarness({ maxMessageLength: 10 });
  try {
    const { host, viewer } = await h.joinPair();
    const msgP = h.waitFor<{ text: string }>(host, SOCKET_EVENTS.CHAT_MESSAGE);
    viewer.emit(SOCKET_EVENTS.CHAT_SEND, {
      text: "1234567890",
      senderName: "Bob",
    }); // at limit
    const msg = await msgP;
    assertEquals(msg.text, "1234567890");

    const errP = h.waitFor<{ code: string }>(viewer, SOCKET_EVENTS.APP_ERROR);
    viewer.emit(SOCKET_EVENTS.CHAT_SEND, {
      text: "12345678901",
      senderName: "Bob",
    }); // beyond
    const err = await errP;
    assertEquals(err.code, "VALIDATION_CODE_MALFORMED");
    host.disconnect();
    viewer.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(() => r()));
  }
});

// Logical limit: exactly-at-rate allowed, just-beyond rate-limited
Deno.test("chat rate limiter allows the window budget and rejects beyond", async () => {
  const h = await makeHarness({ messagesPerWindow: 2, windowMs: 5000 });
  try {
    const { host, viewer } = await h.joinPair();
    const seen: string[] = [];
    host.on(
      SOCKET_EVENTS.CHAT_MESSAGE,
      (m: { text: string }) => seen.push(m.text),
    );
    const errP = h.waitFor<{ code: string }>(viewer, SOCKET_EVENTS.APP_ERROR);

    viewer.emit(SOCKET_EVENTS.CHAT_SEND, { text: "one", senderName: "Bob" });
    viewer.emit(SOCKET_EVENTS.CHAT_SEND, { text: "two", senderName: "Bob" });
    await new Promise((r) => setTimeout(r, 150));
    assertEquals(seen.length, 2); // exactly at budget

    viewer.emit(SOCKET_EVENTS.CHAT_SEND, { text: "three", senderName: "Bob" }); // beyond
    const err = await errP;
    assertEquals(err.code, "SERVER_RATE_LIMITED");
    assertEquals(seen.length, 2);
    host.disconnect();
    viewer.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(() => r()));
  }
});

// Edge: a chat message sent before joining a room is dropped
Deno.test("chat before joining is dropped", async () => {
  const h = await makeHarness();
  try {
    const { host } = await h.joinPair();
    const stray = await h.connect();
    let emitted = false;
    host.on(SOCKET_EVENTS.CHAT_MESSAGE, () => {
      emitted = true;
    });
    stray.emit(SOCKET_EVENTS.CHAT_SEND, { text: "lonely", senderName: "L" });
    await new Promise((r) => setTimeout(r, 200));
    assertEquals(emitted, false);
    host.disconnect();
    stray.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(() => r()));
  }
});
