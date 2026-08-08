export type NodeEnv = "development" | "production";

export interface AppConfig {
  nodeEnv: NodeEnv;
  port: number;
  maxRoomSize: number;
  corsOrigin: string;
  clientBuildPath: string;
  serverBuildPath: string;
}

function toInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export function loadConfig(
  env: Record<string, string | undefined> = Deno.env.toObject(),
): AppConfig {
  return {
    nodeEnv: env.NODE_ENV === "production" ? "production" : "development",
    port: toInt(env.PORT, 5173),
    maxRoomSize: toInt(env.MAX_ROOM_SIZE, 15),
    corsOrigin: env.CORS_ORIGIN ?? "*",
    clientBuildPath: env.CLIENT_BUILD_PATH ?? "./build/client",
    serverBuildPath: env.SERVER_BUILD_PATH ?? "./build/server/index.js",
  };
}
