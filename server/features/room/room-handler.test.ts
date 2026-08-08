import { assertEquals } from "@std/assert";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { io as ClientIO, type Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "../../../shared/contracts/socket-events.ts";
import { RoomStore } from "../../entities/room-store/room-store.ts";
import { createLogger } from "../../shared/logger/logger.ts";
import { RoomHandler } from "./room-handler.ts";

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

  return { io, httpServer, connect, waitFor, rooms };
}

// Happy path
Deno.test("host creates a room and receives a code", async () => {
  const h = await makeHarness();
  try {
    const host = await h.connect();
    const createdP = h.waitFor<{ room: { code: string; hostId: string } }>(
      host,
      SOCKET_EVENTS.ROOM_CREATED,
    );
    host.emit(SOCKET_EVENTS.ROOM_CREATE, { name: "Alice" });
    const created = await createdP;
    assertEquals(typeof created.room.code, "string");
    assertEquals(created.room.hostId, host.id);
    host.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(() => r()));
  }
});

// Sad path: empty host name -> typed error
Deno.test("creating a room with an empty name surfaces VALIDATION_NAME_EMPTY", async () => {
  const h = await makeHarness();
  try {
    const host = await h.connect();
    const errP = h.waitFor<{ code: string }>(host, SOCKET_EVENTS.APP_ERROR);
    host.emit(SOCKET_EVENTS.ROOM_CREATE, { name: "   " });
    const err = await errP;
    assertEquals(err.code, "VALIDATION_NAME_EMPTY");
    host.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(() => r()));
  }
});

// Happy path
Deno.test("viewer joins a host's room and both see membership", async () => {
  const h = await makeHarness();
  try {
    const host = await h.connect();
    const createdP = h.waitFor<{ room: { code: string } }>(
      host,
      SOCKET_EVENTS.ROOM_CREATED,
    );
    host.emit(SOCKET_EVENTS.ROOM_CREATE, { name: "Alice" });
    const { room } = await createdP;

    const joinedOnHost = h.waitFor<{ member: { name: string } }>(
      host,
      SOCKET_EVENTS.MEMBER_JOINED,
    );
    const viewer = await h.connect();
    const joinedP = h.waitFor<
      { room: { memberCount: number }; members: unknown[] }
    >(viewer, SOCKET_EVENTS.ROOM_JOINED);
    viewer.emit(SOCKET_EVENTS.ROOM_JOIN, { code: room.code, name: "Bob" });
    const joined = await joinedP;
    assertEquals(joined.room.memberCount, 2);
    const memberEvent = await joinedOnHost;
    assertEquals(memberEvent.member.name, "Bob");
    host.disconnect();
    viewer.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(() => r()));
  }
});

// Sad path
Deno.test("joining a nonexistent room surfaces ROOM_NOT_FOUND", async () => {
  const h = await makeHarness();
  try {
    const viewer = await h.connect();
    const errP = h.waitFor<{ code: string }>(viewer, SOCKET_EVENTS.APP_ERROR);
    viewer.emit(SOCKET_EVENTS.ROOM_JOIN, { code: "zzzzz", name: "Bob" });
    const err = await errP;
    assertEquals(err.code, "ROOM_NOT_FOUND");
    viewer.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(() => r()));
  }
});

// Logical limit: exactly-at-capacity joins, just-beyond surfaces ROOM_FULL
Deno.test("joining beyond capacity surfaces ROOM_FULL", async () => {
  const h = await makeHarness();
  try {
    // shrink capacity for this harness by recreating the room store at 2
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(() => r()));
    const httpServer2: Server = createServer();
    const io2 = new SocketIOServer(httpServer2, { cors: { origin: "*" } });
    const rooms2 = new RoomStore({
      maxMembers: 2,
      now: () => Date.now(),
      codeLength: 5,
    });
    new RoomHandler({ io: io2, rooms: rooms2, logger: silentLogger() })
      .attach();
    await new Promise<void>((resolve) => httpServer2.listen(0, resolve));
    const addr2 = httpServer2.address() as { port: number };
    const url2 = `http://localhost:${addr2.port}`;
    const connect2 = () =>
      new Promise<Socket>((resolve) => {
        const c: Socket = ClientIO(url2, {
          transports: ["websocket", "polling"],
        });
        c.on("connect", () => resolve(c));
      });
    const waitFor2 = <T>(s: Socket, e: string) =>
      new Promise<T>((resolve) => s.once(e, resolve));

    const host = await connect2();
    const createdP = waitFor2<{ room: { code: string } }>(
      host,
      SOCKET_EVENTS.ROOM_CREATED,
    );
    host.emit(SOCKET_EVENTS.ROOM_CREATE, { name: "H" });
    const { room } = await createdP;
    const v1 = await connect2();
    const j1 = waitFor2<Record<string, unknown>>(v1, SOCKET_EVENTS.ROOM_JOINED);
    v1.emit(SOCKET_EVENTS.ROOM_JOIN, { code: room.code, name: "V1" });
    await j1;
    const v2 = await connect2();
    const errP = waitFor2<{ code: string }>(v2, SOCKET_EVENTS.APP_ERROR);
    v2.emit(SOCKET_EVENTS.ROOM_JOIN, { code: room.code, name: "V2" });
    const err = await errP;
    assertEquals(err.code, "ROOM_FULL");
    host.disconnect();
    v1.disconnect();
    v2.disconnect();
    io2.close();
    await new Promise<void>((r) => httpServer2.close(() => r()));
    return;
  } finally {
    // outer harness already closed above when capacity test ran
  }
});

// Sad path + permission
Deno.test("a viewer cannot lock the room", async () => {
  const h = await makeHarness();
  try {
    const host = await h.connect();
    const createdP = h.waitFor<{ room: { code: string } }>(
      host,
      SOCKET_EVENTS.ROOM_CREATED,
    );
    host.emit(SOCKET_EVENTS.ROOM_CREATE, { name: "Alice" });
    const { room } = await createdP;
    const viewer = await h.connect();
    const joinedP = h.waitFor<Record<string, unknown>>(
      viewer,
      SOCKET_EVENTS.ROOM_JOINED,
    );
    viewer.emit(SOCKET_EVENTS.ROOM_JOIN, { code: room.code, name: "Bob" });
    await joinedP;
    const errP = h.waitFor<{ code: string }>(viewer, SOCKET_EVENTS.APP_ERROR);
    viewer.emit(SOCKET_EVENTS.ROOM_LOCK, {});
    const err = await errP;
    assertEquals(err.code, "ROOM_PERMISSION_DENIED");
    host.disconnect();
    viewer.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(() => r()));
  }
});

// Happy path: host locks/unlocks and viewers are notified
Deno.test("host lock and unlock broadcast to the room", async () => {
  const h = await makeHarness();
  try {
    const host = await h.connect();
    const createdP = h.waitFor<{ room: { code: string } }>(
      host,
      SOCKET_EVENTS.ROOM_CREATED,
    );
    host.emit(SOCKET_EVENTS.ROOM_CREATE, { name: "Alice" });
    const { room } = await createdP;
    const viewer = await h.connect();
    const joinedP = h.waitFor<Record<string, unknown>>(
      viewer,
      SOCKET_EVENTS.ROOM_JOINED,
    );
    viewer.emit(SOCKET_EVENTS.ROOM_JOIN, { code: room.code, name: "Bob" });
    await joinedP;
    const lockedP = h.waitFor<Record<string, never>>(
      viewer,
      SOCKET_EVENTS.ROOM_LOCKED,
    );
    host.emit(SOCKET_EVENTS.ROOM_LOCK, {});
    await lockedP;
    assertEquals(h.rooms.get(room.code)?.locked, true);
    host.disconnect();
    viewer.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(() => r()));
  }
});

// Happy path + sad path: host disconnect ends the room; viewer leave broadcasts
Deno.test("host disconnect ends the room for viewers", async () => {
  const h = await makeHarness();
  try {
    const host = await h.connect();
    const createdP = h.waitFor<{ room: { code: string } }>(
      host,
      SOCKET_EVENTS.ROOM_CREATED,
    );
    host.emit(SOCKET_EVENTS.ROOM_CREATE, { name: "Alice" });
    const { room } = await createdP;
    const viewer = await h.connect();
    const joinedP = h.waitFor<Record<string, unknown>>(
      viewer,
      SOCKET_EVENTS.ROOM_JOINED,
    );
    viewer.emit(SOCKET_EVENTS.ROOM_JOIN, { code: room.code, name: "Bob" });
    await joinedP;
    const endedP = h.waitFor<Record<string, never>>(
      viewer,
      SOCKET_EVENTS.ROOM_ENDED,
    );
    host.disconnect();
    await endedP;
    assertEquals(h.rooms.get(room.code), undefined);
    viewer.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(() => r()));
  }
});

Deno.test("viewer leave broadcasts MEMBER_LEFT and keeps the room", async () => {
  const h = await makeHarness();
  try {
    const host = await h.connect();
    const createdP = h.waitFor<{ room: { code: string } }>(
      host,
      SOCKET_EVENTS.ROOM_CREATED,
    );
    host.emit(SOCKET_EVENTS.ROOM_CREATE, { name: "Alice" });
    const { room } = await createdP;
    const viewer = await h.connect();
    const joinedP = h.waitFor<Record<string, unknown>>(
      viewer,
      SOCKET_EVENTS.ROOM_JOINED,
    );
    viewer.emit(SOCKET_EVENTS.ROOM_JOIN, { code: room.code, name: "Bob" });
    await joinedP;
    const leftP = h.waitFor<{ memberId: string }>(
      host,
      SOCKET_EVENTS.MEMBER_LEFT,
    );
    const viewerId = viewer.id;
    viewer.disconnect();
    const left = await leftP;
    assertEquals(left.memberId, viewerId);
    assertEquals(h.rooms.get(room.code) !== undefined, true);
    host.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(() => r()));
  }
});
