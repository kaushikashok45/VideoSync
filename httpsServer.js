import * as fs from "node:fs"; // Use import * as fs for consistency
import * as https from "node:https"; // Use import * as https for consistency
import express from "express";
import { createRequestHandler } from "@remix-run/express"; // Import the Remix request handler
import { Server } from "socket.io";
import * as http from "node:http";

const app = express();

// All other routes (like API endpoints) should go before the Remix handler
// app.use("/api", someApiRouter);

// IMPORTANT: Remix will create the 'build' directory and an index.js inside it.
// You need to dynamically import it because the build output changes.
// During development, the 'build' might be in a temporary location or served differently by the dev server.
// During production, it's typically 'build/index.js'.

// --- This part is crucial for Remix integration ---
// In a custom server, you typically handle two modes: development and production.
// For HTTPS in development, Remix's `dev.https` option in `remix.config.js`
// is usually for Remix's built-in dev server. If you're using a custom server.js
// for *development* AND HTTPS, it gets a bit more complex.

// Let's assume this server.js is for a production deployment, or for a dev setup
// where you manually start 'remix build' and then this server.
// For dev with HMR, Remix's built-in dev server (with dev.https in remix.config.js)
// is usually preferred.

// If you are using this `server.js` with `remix.config.js` like:
// server: "./server.js",
// then you need to make sure `createRequestHandler` gets the correct build.

// Simplified approach for a custom server.js that *might* be used for dev or prod:
const IS_DEVELOPMENT = process.env.NODE_ENV === "development";

// Define the port (it's good to use an environment variable for production)
const port = process.env.PORT || 5174;

// Handle assets served by Remix (e.g., /build/*)
app.use(express.static("public/build", { maxAge: "1h" })); // Serve public assets

app.all(
  "*",
  IS_DEVELOPMENT
    ? (req, res, next) => {
        // In development, Remix usually handles its own server and build refresh.
        // If you're explicitly using this `server.js` for development with `remix.config.js`
        // pointing to it, you'd usually pass a dynamic `build` function.
        // For simplicity and to fix the 404, we'll assume `build` is ready.
        // However, for hot reloading, Remix's built-in dev server is better.

        // For a custom dev server using Remix's dev features, you'd typically do:
        // import { createDevRequestHandler } from "@remix-run/dev/server"; // pseudo code, check Remix docs
        // createDevRequestHandler({ build, mode: "development" })(req, res, next);
        // BUT THE `build` IS NOT STATIC IN DEV!

        // For now, let's assume `remix build` has run, or you're connecting to Remix's internal dev logic
        // This setup is usually for *production* where `build` is static.
        // If you're using this for DEV, you might need a different approach entirely for HMR.

        // *************** CRITICAL FIX ***************
        // This is the core Remix integration.
        // It imports the server-side build of your Remix app.
        import("./build/server/index.js")
          .then((build) => {
            // Dynamically import build
            createRequestHandler({
              build: build,
              mode: process.env.NODE_ENV,
            })(req, res, next);
          })
          .catch(next); // Catch import errors
      }
    : createRequestHandler({
        // In production, the build is static
        build: await import("./build/server/index.js"), // Synchronous import for prod (only runs once)
        mode: process.env.NODE_ENV,
      }),
);

// Error handling (optional, but good practice)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send("Something broke!");
});

const httpsServer = https.createServer(
  {
    key: fs.readFileSync("./localhost.key"),
    cert: fs.readFileSync("./localhost.pem"),
  },
  app,
);

httpsServer.listen(port, () => {
  console.log(
    `✅ Express server listening on ${IS_DEVELOPMENT ? "https" : "http"}://localhost:${port}`,
  );
  console.log(`Remix App Mode: ${process.env.NODE_ENV}`);
});

const socketIoHttpServer = http.createServer();
const ioServer = new Server(socketIoHttpServer, {
  cors: {
    origin: "https://localhost:5174",
    methods: ["GET", "POST"],
  },
});

const SOCKET_PORT = 3001;
ioServer.on("connection", (socket) => {
  console.log(`A user connected on ${socket.id}`);
  socket.on("signal", (message) => {
    console.log(`signal from client: ${message}`);
    ioServer.to(message.to).emit("signal", { signal: message.signal });
  });
  socket.on("disconnect", () => {
    console.log(`User Disconnected from ${socket.id}`);
  });
});

socketIoHttpServer.listen(SOCKET_PORT, () => {
  console.log(`Socket.IO server listening on port ${SOCKET_PORT}`);
});
