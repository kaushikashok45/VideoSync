import http from "node:http";
import path from "node:path";
import process from "node:process";
import express from "express";
import { createRequestHandler } from "@react-router/express";
import type { ServerBuild } from "react-router";
import { Server as SocketIOServer } from "socket.io";
import { createServer as createViteServer } from "vite";

import type { AppConfig } from "./config.ts";
import type { Logger } from "../shared/logger/logger.ts";
import { RoomStore } from "../entities/room-store/room-store.ts";
import { RoomHandler } from "../features/room/room-handler.ts";
import { ChatHandler } from "../features/chat/chat-handler.ts";
import { ReactionHandler } from "../features/reactions/reaction-handler.ts";
import { SignalingHandler } from "../features/signaling/signaling-handler.ts";

export async function startServer(
  config: AppConfig,
  logger: Logger,
): Promise<http.Server> {
  const app = express();
  const server = http.createServer(app);

  const io = new SocketIOServer(server, {
    cors: { origin: config.corsOrigin, credentials: true },
  });

  const rooms = new RoomStore({
    maxMembers: config.maxRoomSize,
    now: () => Date.now(),
    codeLength: 5,
  });

  new SignalingHandler({ io, logger }).attach();
  new RoomHandler({ io, rooms, logger }).attach();
  new ChatHandler({ io, logger }).attach();
  new ReactionHandler({ io, logger }).attach();

  app.get("/healthz", (_req, res) => {
    res.json({ ok: true });
  });

  if (config.nodeEnv === "development") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);
    app.use(
      createRequestHandler({
        build: () =>
          vite.ssrLoadModule(
            "virtual:react-router/server-build",
          ) as Promise<ServerBuild>,
        mode: "development",
      }),
    );
  } else {
    app.use(express.static(config.clientBuildPath));
    app.use(
      createRequestHandler({
        build: await import(
          path.resolve(process.cwd(), config.serverBuildPath)
        ),
      }),
    );
  }

  await new Promise<void>((resolve) => server.listen(config.port, resolve));
  logger.info("server listening", { port: config.port, env: config.nodeEnv });
  return server;
}
