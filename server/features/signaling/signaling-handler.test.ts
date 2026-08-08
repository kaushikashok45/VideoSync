import { assertEquals } from "@std/assert";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { io as ClientIO, type Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "../../../shared/contracts/socket-events.ts";
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
      const client: Socket = ClientIO(url, { transports: ["websocket", "polling"] });
      client.on("connect", () => resolve(client));
    });
  }

  return { io, httpServer, connect };
}

// Happy path: targeted relay
Deno.test("signal relays to a targeted socket with sender peerId", async () => {
  const h = await makeHarness();
  try {
    const a = await h.connect();
    const b = await h.connect();
    const received = new Promise<{ peerId: string; signalData: unknown }>((resolve) => {
      b.on(SOCKET_EVENTS.SIGNAL, resolve);
    });
    a.emit(SOCKET_EVENTS.SIGNAL, { to: b.id, signalData: { sdp: "offer" } });
    const payload = await received;
    assertEquals(payload.peerId, a.id);
    assertEquals(payload.signalData, { sdp: "offer" });
    a.disconnect();
    b.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((resolve) => h.httpServer.close(() => resolve()));
  }
});

// Sad path: signal to a nonexistent target is dropped silently (no crash)
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
