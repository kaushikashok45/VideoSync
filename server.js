import https from "node:https";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import express from "express";
import { createRequestHandler } from "@react-router/express";
import { Server as SocketIOServer } from "socket.io";
import { createServer } from "vite";

const port = process.env.PORT || 5173;

function attachSocketIOServer(server) {
  const io = new SocketIOServer(server, {
    cors: {
      origin: `https://localhost:${port}`,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log("A user connected on socket id : ", socket.id);

    socket.on("video event", (msg) => {
      console.log(
        `Received video event from ${socket.id} with message : `,
        msg,
      );
    });

    socket.on("join-room", (data) => {
      const { roomId, userName } = data;
      socket.join(roomId);
      console.log(`${socket.id} joined room ${roomId}`);
      socket.to(roomId).emit("user-joined", {
        peerId: socket.id,
        userName,
      });
      io.to(socket.id).emit("socket-id-meta", {
        peerId: socket.id,
      });
    });

    socket.on("signal", (data) => {
      console.log(`Received signal from ${socket.id} : `, data);
      const signalData = {
        peerId: socket.id,
        signalData: data.signalData,
      };
      let logMsg = "";
      if (data.to) {
        io.to(data.to).emit("signal", signalData);
        logMsg =
          `signal from socket id : ${socket.id} emitted to peer: ${data.to}`;
      } else {
        const room = Array.from(socket.rooms).find((r) => r !== socket.id);
        if (room) {
          socket.to(room).emit("signal", signalData);
          logMsg =
            `signal from socket id : ${socket.id} emitted to room ${room}`;
        }
      }
      console.log(logMsg);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected from socket id : ", socket.id);
      const room = Array.from(socket.rooms).find((r) => r !== socket.id);
      if (room) {
        socket.to(room).emit("user-left", `${socket.id} has left the room`);
      }
    });
  });
}

const app = express();

const IS_DEVELOPMENT = process.env.NODE_ENV !== "production";
let server;
let viteServer;
if (IS_DEVELOPMENT) {
  const key = fs.readFileSync("./localhost.key");
  const cert = fs.readFileSync("./localhost.pem");
  server = https.createServer({ key, cert }, app);

  viteServer = await createServer({
    server: {
      middlewareMode: {
        server: server,
      },
      hmr: true,
    },
    mode: "development",
  });
  app.use(viteServer.middlewares);
} else {
  server = https.createServer(app);
}

attachSocketIOServer(server);
app.use(express.static("./build/client"));

app.use(
  createRequestHandler({
    build: IS_DEVELOPMENT
      ? () => viteServer.ssrLoadModule("virtual:react-router/server-build")
      : await import("./build/server/index.js"),
    assetsBuildDirectory: path.resolve("~/build/client"),
  }),
);

server.listen(port, () => {
  console.log(`HTTPS + React Router + Socket.IO on https://localhost:${port}`);
});
