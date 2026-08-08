import { assertEquals } from "@std/assert";
import { loadConfig } from "./config.ts";

// Happy path + edge: defaults when env is empty
Deno.test("loadConfig uses defaults when env is empty", () => {
  const cfg = loadConfig({});
  assertEquals(cfg.nodeEnv, "development");
  assertEquals(cfg.port, 5173);
  assertEquals(cfg.maxRoomSize, 15);
  assertEquals(cfg.clientBuildPath, "./build/client");
});

// Happy path: explicit production values
Deno.test("loadConfig reads production values from env", () => {
  const cfg = loadConfig({
    NODE_ENV: "production",
    PORT: "8080",
    MAX_ROOM_SIZE: "12",
  });
  assertEquals(cfg.nodeEnv, "production");
  assertEquals(cfg.port, 8080);
  assertEquals(cfg.maxRoomSize, 12);
});

// Mutation case: anything other than "production" is development
Deno.test("loadConfig treats non-production NODE_ENV as development", () => {
  assertEquals(loadConfig({ NODE_ENV: "staging" }).nodeEnv, "development");
  assertEquals(loadConfig({ NODE_ENV: "" }).nodeEnv, "development");
});

// Logical limit: invalid numeric env falls back to default
Deno.test("loadConfig falls back to defaults for invalid port", () => {
  assertEquals(loadConfig({ PORT: "abc" }).port, 5173);
  assertEquals(loadConfig({ MAX_ROOM_SIZE: "abc" }).maxRoomSize, 15);
});
