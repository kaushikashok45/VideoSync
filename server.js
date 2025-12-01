import express from "express";
import http from "http";
import https from "https";
import cors from "cors";
import { readFileSync } from "fs";
import { Server as SocketIOServer } from "socket.io";
import { createRequestHandler } from "@remix-run/express";
import * as build from "./build/server/index.js";
import path from "path";
import { fileURLToPath } from "url";

const mode = process.env.NODE_ENV || "development";
const isDev = mode !== "production";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

// ---- Common middleware (runs in both dev & prod) ----

app.use(express.static("./build/client"));

// CORS origins
const APPSERVERPORT = process.env.PORT || 5173;
const devOrigin = `https://localhost:${APPSERVERPORT}`;

const allowedOrigins = isDev
  ? [devOrigin, "https://deane-margaritaceous-jacqueline.ngrok-free.dev"]
  : [
      // In prod, use your Render URL(s) here:
      "https://your-render-service.onrender.com",
    ];

app.use(
  cors({
    origin: allowedOrigins,
  })
);

// Remix catch-all route (correct Express syntax)
app.all(
  "*",
  createRequestHandler({
    build,
    mode,
  })
);
// ---- Create the server & Socket.IO ----

let server;

if (isDev) {
  // Local dev: use self-signed HTTPS (your current style)
  const key = readFileSync("./localhost.key");
  const cert = readFileSync("./localhost.pem");

  server = https.createServer({ key, cert }, app);

  server.listen(APPSERVERPORT, () => {
    console.log(`Dev server listening on https://localhost:${APPSERVERPORT}`);
  });
} else {
  // Production on Render:
  // Render already terminates HTTPS, so **plain HTTP** here.
  const port = process.env.PORT || 3000;

  server = http.createServer(app);

  server.listen(port, () => {
    console.log(`Server listening on port ${port} (production)`);
  });
}

// Attach Socket.IO to the SAME server in both envs
const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  },
});

// ---- Socket.IO handlers ----

io.on("connection", (socket) => {
  console.log("A user connected on socket id : ", socket.id);

  socket.on("video event", (msg) => {
    console.log(`Received video event from ${socket.id} with message : `, msg);
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
      logMsg = `signal from socket id : ${socket.id} emitted to peer: ${data.to}`;
    } else {
      const room = Array.from(socket.rooms).find((r) => r !== socket.id);
      if (room) {
        socket.to(room).emit("signal", signalData);
        logMsg = `signal from socket id : ${socket.id} emitted to room ${room}`;
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
