import { assertEquals } from "@std/assert";
import {
  resolveRoomConnectionState,
  type RoomConnectionInput,
} from "./resolve-room-connection-state.ts";

function resolve(
  input: Partial<RoomConnectionInput>,
) {
  return resolveRoomConnectionState({
    mode: "receiver",
    socketState: "connected",
    hostPresent: false,
    hasStream: false,
    sourceReady: false,
    hadStream: false,
    ...input,
  });
}

Deno.test("receiver stays in connecting before the host is visible", () => {
  assertEquals(resolve({}).stage, "connecting");
});

Deno.test("receiver waits for source once the host is present", () => {
  assertEquals(resolve({ hostPresent: true }).stage, "waiting-for-source");
});

Deno.test("receiver waits for host playback once the source is ready", () => {
  assertEquals(
    resolve({ hostPresent: true, sourceReady: true }).stage,
    "waiting-for-host",
  );
});

Deno.test("receiver reports in-sync once the peer stream is attached", () => {
  const state = resolve({
    hostPresent: true,
    sourceReady: true,
    hasStream: true,
  });
  assertEquals(state.stage, "in-sync");
  assertEquals(state.panelTone, "success");
});

Deno.test("receiver reconnects after losing an established stream", () => {
  const state = resolve({
    socketState: "reconnecting",
    hostPresent: true,
    sourceReady: true,
    hadStream: true,
  });
  assertEquals(state.stage, "reconnecting");
  assertEquals(state.banner, "Connection interrupted. Trying again.");
});

Deno.test("host surfaces socket interruptions as reconnecting", () => {
  const state = resolveRoomConnectionState({
    mode: "host",
    socketState: "disconnected",
    hostPresent: true,
    hasStream: true,
    sourceReady: true,
    hadStream: true,
  });
  assertEquals(state.stage, "reconnecting");
  assertEquals(state.label, "Reconnecting");
});
