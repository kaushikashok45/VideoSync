import { assertEquals } from "@std/assert";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { io as ClientIO, type Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "../../../shared/contracts/socket-events.ts";
import { RoomStore } from "../../entities/room-store/room-store.ts";
import { RoomHandler } from "../room/room-handler.ts";
import { createLogger } from "../../shared/logger/logger.ts";
import { SignalingHandler } from "./signaling-handler.ts";

function silentLogger() {
  return createLogger({ level: "error", sink: () => {} });
}

async function makeHarness() {
  const httpServer: Server = createServer();
  const io = new SocketIOServer(httpServer, { cors: { origin: "*" } });
  new SignalingHandler({ io, logger: silentLogger() }).attach();
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

  return { io, httpServer, connect };
}

function waitForEvent<T>(socket: Socket, event: string): Promise<T> {
  return new Promise((resolve) => socket.once(event, resolve));
}

// Harness with RoomHandler attached too, so members actually belong to a room
// server-side (socket.data.roomCode / socket.rooms), the way real clients do.
async function makeRoomedHarness() {
  const httpServer: Server = createServer();
  const io = new SocketIOServer(httpServer, { cors: { origin: "*" } });
  const rooms = new RoomStore({
    maxMembers: 15,
    now: () => Date.now(),
    codeLength: 5,
  });
  new RoomHandler({ io, rooms, logger: silentLogger() }).attach();
  new SignalingHandler({ io, logger: silentLogger() }).attach();
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

  async function makeRoom(hostName: string, viewerName: string) {
    const host = await connect();
    const createdP = waitForEvent<{ room: { code: string } }>(
      host,
      SOCKET_EVENTS.ROOM_CREATED,
    );
    host.emit(SOCKET_EVENTS.ROOM_CREATE, { name: hostName });
    const { room } = await createdP;
    const viewer = await connect();
    const joinedP = waitForEvent<Record<string, unknown>>(
      viewer,
      SOCKET_EVENTS.ROOM_JOINED,
    );
    viewer.emit(SOCKET_EVENTS.ROOM_JOIN, { code: room.code, name: viewerName });
    await joinedP;
    return { host, viewer, code: room.code };
  }

  return { io, httpServer, connect, makeRoom };
}

// Happy path: targeted relay, sender and target in the SAME room.
// This test previously used the roomless harness and passed, which is exactly how
// the cross-room leak survived: it pinned pre-isolation behaviour as a requirement.
// Signalling now requires shared room membership, consistent with chat and
// reactions, both of which already drop pre-join actions.
Deno.test("signal relays to a targeted socket in the same room with sender peerId", async () => {
  const h = await makeRoomedHarness();
  try {
    const room = await h.makeRoom("Alice", "Bob");
    const received = new Promise<{ peerId: string; signalData: unknown }>(
      (resolve) => {
        room.viewer.on(SOCKET_EVENTS.SIGNAL, resolve);
      },
    );
    room.host.emit(SOCKET_EVENTS.SIGNAL, {
      to: room.viewer.id,
      signalData: { sdp: "offer" },
    });
    const payload = await received;
    assertEquals(payload.peerId, room.host.id);
    assertEquals(payload.signalData, { sdp: "offer" });
    room.host.disconnect();
    room.viewer.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((resolve) => h.httpServer.close(() => resolve()));
  }
});

Deno.test("signal to a nonexistent target does not throw", async () => {
  const h = await makeHarness();
  try {
    const a = await h.connect();
    a.emit(SOCKET_EVENTS.SIGNAL, { to: "nope", signalData: { sdp: "x" } });
    await new Promise((r) => setTimeout(r, 200));
    assertEquals(a.connected, true);
    a.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((resolve) => h.httpServer.close(() => resolve()));
  }
});

// Edge: missing 'to' relays to the room (no targeted peer) — still no crash
Deno.test("signal without a target is tolerated", async () => {
  const h = await makeHarness();
  try {
    const a = await h.connect();
    a.emit(SOCKET_EVENTS.SIGNAL, { signalData: { sdp: "x" } });
    await new Promise((r) => setTimeout(r, 200));
    assertEquals(a.connected, true);
    a.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((resolve) => h.httpServer.close(() => resolve()));
  }
});

// Room isolation (ROOM-INV-11): an untargeted signal from one room reaches no member of another room.
// The untargeted path relays via `socket.to(currentRoom(socket))`, which is server-derived, so this is
// expected to hold.
Deno.test("an untargeted signal from one room reaches no member of another room", async () => {
  const h = await makeRoomedHarness();
  try {
    const roomA = await h.makeRoom("Alice", "Bob");
    const roomB = await h.makeRoom("Carol", "Dave");

    let roomBHostReceived = false;
    let roomBViewerReceived = false;
    roomB.host.on(SOCKET_EVENTS.SIGNAL, () => {
      roomBHostReceived = true;
    });
    roomB.viewer.on(SOCKET_EVENTS.SIGNAL, () => {
      roomBViewerReceived = true;
    });

    const signalOnAHost = waitForEvent<{ peerId: string }>(
      roomA.host,
      SOCKET_EVENTS.SIGNAL,
    );
    roomA.viewer.emit(SOCKET_EVENTS.SIGNAL, { signalData: { sdp: "offer" } });
    const signal = await signalOnAHost;
    assertEquals(signal.peerId, roomA.viewer.id);

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

// Room isolation (ROOM-INV-11): a targeted signal from a member of one room must not reach a peer in
// another room. THIS IS EXPECTED TO FAIL: signaling-handler.ts's targeted path
// (`this.deps.io.to(payload.to).emit(...)`, server/features/signaling/signaling-handler.ts:34) relays to
// any live socket id server-wide with no check that the target shares the sender's room. A member of
// room A can address any socket id — including one belonging to room B — and the signal is delivered.
Deno.test("a targeted signal from a member of one room reaches no member of another room", async () => {
  const h = await makeRoomedHarness();
  try {
    const roomA = await h.makeRoom("Alice", "Bob");
    const roomB = await h.makeRoom("Carol", "Dave");

    let roomBHostReceived = false;
    roomB.host.on(SOCKET_EVENTS.SIGNAL, () => {
      roomBHostReceived = true;
    });

    roomA.viewer.emit(SOCKET_EVENTS.SIGNAL, {
      to: roomB.host.id,
      signalData: { sdp: "cross-room-offer" },
    });
    await new Promise((r) => setTimeout(r, 200));

    assertEquals(roomBHostReceived, false);

    roomA.host.disconnect();
    roomA.viewer.disconnect();
    roomB.host.disconnect();
    roomB.viewer.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(() => r()));
  }
});

// ARCH-004 / ARCH-005: the refusal is typed, not silent.
Deno.test("a refused cross-room signal emits ROOM_PERMISSION_DENIED to the sender", async () => {
  const h = await makeRoomedHarness();
  try {
    const roomA = await h.makeRoom("Alice", "Bob");
    const roomB = await h.makeRoom("Carol", "Dave");

    const errP = waitForEvent<{ code: string }>(
      roomA.viewer,
      SOCKET_EVENTS.APP_ERROR,
    );
    roomA.viewer.emit(SOCKET_EVENTS.SIGNAL, {
      to: roomB.host.id,
      signalData: { sdp: "cross-room-offer" },
    });
    const err = await errP;
    assertEquals(err.code, "ROOM_PERMISSION_DENIED");

    roomA.host.disconnect();
    roomA.viewer.disconnect();
    roomB.host.disconnect();
    roomB.viewer.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((resolve) => h.httpServer.close(() => resolve()));
  }
});

// A socket in no room has no legitimate signalling partner, so it may not target one.
Deno.test("a targeted signal from a socket in no room is refused with a typed error", async () => {
  const h = await makeHarness();
  try {
    const a = await h.connect();
    const b = await h.connect();
    const errP = waitForEvent<{ code: string }>(a, SOCKET_EVENTS.APP_ERROR);
    a.emit(SOCKET_EVENTS.SIGNAL, { to: b.id, signalData: { sdp: "offer" } });
    const err = await errP;
    assertEquals(err.code, "ROOM_PERMISSION_DENIED");
    a.disconnect();
    b.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((resolve) => h.httpServer.close(() => resolve()));
  }
});
