import { assert, assertEquals } from "@std/assert";
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

async function makeRoom(
  h: Awaited<ReturnType<typeof makeHarness>>,
  hostName: string,
  viewerName: string,
) {
  const host = await h.connect();
  const createdP = h.waitFor<{ room: { code: string } }>(
    host,
    SOCKET_EVENTS.ROOM_CREATED,
  );
  host.emit(SOCKET_EVENTS.ROOM_CREATE, { name: hostName });
  const { room } = await createdP;
  const viewer = await h.connect();
  const joinedP = h.waitFor<Record<string, unknown>>(
    viewer,
    SOCKET_EVENTS.ROOM_JOINED,
  );
  // Also await the host's MEMBER_JOINED. The server emits ROOM_JOINED to the
  // joiner and MEMBER_JOINED to the rest of the room; awaiting only the former
  // leaves the latter in flight, so a later listener on this host would catch
  // this room's own join event and read as a cross-room leak.
  const memberSeenP = h.waitFor<Record<string, unknown>>(
    host,
    SOCKET_EVENTS.MEMBER_JOINED,
  );
  viewer.emit(SOCKET_EVENTS.ROOM_JOIN, { code: room.code, name: viewerName });
  await joinedP;
  await memberSeenP;
  return { host, viewer, code: room.code };
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

// Sad path: joining a locked room surfaces ROOM_LOCKED
Deno.test("joining a locked room surfaces ROOM_LOCKED", async () => {
  const h = await makeHarness();
  try {
    const host = await h.connect();
    const createdP = h.waitFor<{ room: { code: string } }>(
      host,
      SOCKET_EVENTS.ROOM_CREATED,
    );
    host.emit(SOCKET_EVENTS.ROOM_CREATE, { name: "Alice" });
    const { room } = await createdP;
    host.emit(SOCKET_EVENTS.ROOM_LOCK, {});
    const viewer = await h.connect();
    const errP = h.waitFor<{ code: string }>(viewer, SOCKET_EVENTS.APP_ERROR);
    viewer.emit(SOCKET_EVENTS.ROOM_JOIN, { code: room.code, name: "Bob" });
    const err = await errP;
    assertEquals(err.code, "ROOM_LOCKED");
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

Deno.test("creating a new room leaves the previous room behind", async () => {
  const h = await makeHarness();
  try {
    const host = await h.connect();
    const firstCreated = h.waitFor<{ room: { code: string } }>(
      host,
      SOCKET_EVENTS.ROOM_CREATED,
    );
    host.emit(SOCKET_EVENTS.ROOM_CREATE, { name: "Alice" });
    const firstRoom = (await firstCreated).room;

    const secondCreated = h.waitFor<{ room: { code: string } }>(
      host,
      SOCKET_EVENTS.ROOM_CREATED,
    );
    host.emit(SOCKET_EVENTS.ROOM_CREATE, { name: "Alice" });
    const secondRoom = (await secondCreated).room;

    assertEquals(h.rooms.get(firstRoom.code), undefined);
    assertEquals(secondRoom.code === firstRoom.code, false);
    host.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(() => r()));
  }
});

Deno.test("failed join keeps the viewer in the current room", async () => {
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
    viewer.emit(SOCKET_EVENTS.ROOM_JOIN, { code: "zzzzz", name: "Bob" });
    const err = await errP;

    assertEquals(err.code, "ROOM_NOT_FOUND");
    assertEquals(h.rooms.memberCount(h.rooms.getOrThrow(room.code)), 2);
    host.disconnect();
    viewer.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(() => r()));
  }
});

Deno.test("failed create keeps the host room alive", async () => {
  const h = await makeHarness();
  try {
    const host = await h.connect();
    const createdP = h.waitFor<{ room: { code: string } }>(
      host,
      SOCKET_EVENTS.ROOM_CREATED,
    );
    host.emit(SOCKET_EVENTS.ROOM_CREATE, { name: "Alice" });
    const { room } = await createdP;

    const errP = h.waitFor<{ code: string }>(host, SOCKET_EVENTS.APP_ERROR);
    host.emit(SOCKET_EVENTS.ROOM_CREATE, { name: "   " });
    const err = await errP;

    assertEquals(err.code, "VALIDATION_NAME_EMPTY");
    assertEquals(h.rooms.get(room.code) !== undefined, true);
    host.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(() => r()));
  }
});

// Room isolation (ROOM-INV-11): a member joining one room sends no MEMBER_JOINED to another room's members
Deno.test("a member joining one room reaches no member of another room", async () => {
  const h = await makeHarness();
  try {
    const roomA = await makeRoom(h, "Alice", "Bob");
    const roomB = await makeRoom(h, "Carol", "Dave");

    let roomBHostReceived = false;
    let roomBViewerReceived = false;
    roomB.host.on(SOCKET_EVENTS.MEMBER_JOINED, () => {
      roomBHostReceived = true;
    });
    roomB.viewer.on(SOCKET_EVENTS.MEMBER_JOINED, () => {
      roomBViewerReceived = true;
    });

    const joinedOnAHost = h.waitFor<{ member: { name: string } }>(
      roomA.host,
      SOCKET_EVENTS.MEMBER_JOINED,
    );
    const newViewer = await h.connect();
    const joinedP = h.waitFor<Record<string, unknown>>(
      newViewer,
      SOCKET_EVENTS.ROOM_JOINED,
    );
    newViewer.emit(SOCKET_EVENTS.ROOM_JOIN, {
      code: roomA.code,
      name: "Eve",
    });
    await joinedP;
    const memberEvent = await joinedOnAHost;
    assertEquals(memberEvent.member.name, "Eve");

    await new Promise((r) => setTimeout(r, 200));
    assertEquals(roomBHostReceived, false);
    assertEquals(roomBViewerReceived, false);

    roomA.host.disconnect();
    roomA.viewer.disconnect();
    newViewer.disconnect();
    roomB.host.disconnect();
    roomB.viewer.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(() => r()));
  }
});

// Room isolation (ROOM-INV-11): a member leaving one room sends no MEMBER_LEFT to another room's members
Deno.test("a member leaving one room reaches no member of another room", async () => {
  const h = await makeHarness();
  try {
    const roomA = await makeRoom(h, "Alice", "Bob");
    const roomB = await makeRoom(h, "Carol", "Dave");

    let roomBHostReceived = false;
    let roomBViewerReceived = false;
    roomB.host.on(SOCKET_EVENTS.MEMBER_LEFT, () => {
      roomBHostReceived = true;
    });
    roomB.viewer.on(SOCKET_EVENTS.MEMBER_LEFT, () => {
      roomBViewerReceived = true;
    });

    const leftOnAHost = h.waitFor<{ memberId: string }>(
      roomA.host,
      SOCKET_EVENTS.MEMBER_LEFT,
    );
    const viewerAId = roomA.viewer.id;
    roomA.viewer.disconnect();
    const left = await leftOnAHost;
    assertEquals(left.memberId, viewerAId);

    await new Promise((r) => setTimeout(r, 200));
    assertEquals(roomBHostReceived, false);
    assertEquals(roomBViewerReceived, false);

    roomA.host.disconnect();
    roomB.host.disconnect();
    roomB.viewer.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(() => r()));
  }
});

// Room isolation (ROOM-INV-11): a room ending on host disconnect leaves another room and its members untouched
Deno.test("a room ending on host disconnect reaches no member of another room and leaves it running", async () => {
  const h = await makeHarness();
  try {
    const roomA = await makeRoom(h, "Alice", "Bob");
    const roomB = await makeRoom(h, "Carol", "Dave");

    let roomBHostReceived = false;
    let roomBViewerReceived = false;
    roomB.host.on(SOCKET_EVENTS.ROOM_ENDED, () => {
      roomBHostReceived = true;
    });
    roomB.viewer.on(SOCKET_EVENTS.ROOM_ENDED, () => {
      roomBViewerReceived = true;
    });

    const endedOnAViewer = h.waitFor<Record<string, never>>(
      roomA.viewer,
      SOCKET_EVENTS.ROOM_ENDED,
    );
    roomA.host.disconnect();
    await endedOnAViewer;
    assertEquals(h.rooms.get(roomA.code), undefined);

    await new Promise((r) => setTimeout(r, 200));
    assertEquals(roomBHostReceived, false);
    assertEquals(roomBViewerReceived, false);
    assertEquals(h.rooms.get(roomB.code) !== undefined, true);

    roomA.viewer.disconnect();
    roomB.host.disconnect();
    roomB.viewer.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(() => r()));
  }
});

// Room isolation (ROOM-INV-11): supplying another room's code to a mutating op has no effect on that room
Deno.test("locking a room ignores a foreign room code supplied by the client and does not affect that other room", async () => {
  const h = await makeHarness();
  try {
    const roomA = await makeRoom(h, "Alice", "Bob");
    const roomB = await makeRoom(h, "Carol", "Dave");

    let roomBLockedReceived = false;
    roomB.host.on(SOCKET_EVENTS.ROOM_LOCKED, () => {
      roomBLockedReceived = true;
    });
    roomB.viewer.on(SOCKET_EVENTS.ROOM_LOCKED, () => {
      roomBLockedReceived = true;
    });

    const lockedOnAViewer = h.waitFor<Record<string, never>>(
      roomA.viewer,
      SOCKET_EVENTS.ROOM_LOCKED,
    );
    // roomA's host is only ever a member of roomA server-side; a client-supplied
    // "code" for roomB must not redirect the mutation there.
    roomA.host.emit(SOCKET_EVENTS.ROOM_LOCK, { code: roomB.code });
    await lockedOnAViewer;

    assertEquals(h.rooms.get(roomA.code)?.locked, true);
    assertEquals(h.rooms.get(roomB.code)?.locked, false);

    await new Promise((r) => setTimeout(r, 200));
    assertEquals(roomBLockedReceived, false);

    roomA.host.disconnect();
    roomA.viewer.disconnect();
    roomB.host.disconnect();
    roomB.viewer.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(() => r()));
  }
});

// ROOM-INV-10: a room that has ended accepts no new member and cannot be re-opened
Deno.test("a room that has ended accepts no new member and cannot be re-opened", async () => {
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

    // First attempt to rejoin the ended room's code
    const errP1 = h.waitFor<{ code: string }>(viewer, SOCKET_EVENTS.APP_ERROR);
    viewer.emit(SOCKET_EVENTS.ROOM_JOIN, { code: room.code, name: "Bob" });
    const err1 = await errP1;
    assertEquals(err1.code, "ROOM_NOT_FOUND");
    assertEquals(h.rooms.get(room.code), undefined);

    // Second attempt, later — the room must never be resurrected
    const errP2 = h.waitFor<{ code: string }>(viewer, SOCKET_EVENTS.APP_ERROR);
    viewer.emit(SOCKET_EVENTS.ROOM_JOIN, { code: room.code, name: "Bob" });
    const err2 = await errP2;
    assertEquals(err2.code, "ROOM_NOT_FOUND");
    assertEquals(h.rooms.get(room.code), undefined);

    viewer.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(() => r()));
  }
});

// MEMBER-INV-7: a client-asserted role or canControl in the join payload is not trusted
Deno.test("a client-asserted role or canControl in the join payload is not trusted by the server", async () => {
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
    const joinedP = h.waitFor<
      { members: Array<{ id: string; role: string; canControl: boolean }> }
    >(viewer, SOCKET_EVENTS.ROOM_JOINED);
    // A malicious client asserts a role and control it was never granted.
    viewer.emit(SOCKET_EVENTS.ROOM_JOIN, {
      code: room.code,
      name: "Eve",
      role: "host",
      canControl: true,
    });
    const joined = await joinedP;
    const eve = joined.members.find((m) => m.id === viewer.id);
    assertEquals(eve?.role, "viewer");
    assertEquals(eve?.canControl, false);

    // Server-side room state agrees: there is still exactly one host, the original.
    const storedRoom = h.rooms.getOrThrow(room.code);
    assertEquals(storedRoom.hostId, host.id);
    const viewerId = viewer.id;
    assert(viewerId, "viewer socket must be connected to have an id");
    assertEquals(storedRoom.members.get(viewerId)?.role, "viewer");
    assertEquals(storedRoom.members.get(viewerId)?.canControl, false);

    host.disconnect();
    viewer.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(() => r()));
  }
});
