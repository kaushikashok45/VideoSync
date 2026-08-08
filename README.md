# VideoSync — "The Sync Party"

Real-time synchronized video watching. A host uploads a video file, receivers
join a room by link, and playback (pause/resume/seek/forward/rewind/volume)
stays in sync across all peers.

- **App**: React 19 + React Router v7 (framework mode, SSR, flat routes)
- **Signaling**: Express + Socket.IO over HTTP
- **Media**: WebRTC via `simple-peer` (P2P stream + data channel for control
  events)
- **Runtime**: [Deno](https://deno.com) 2.x — no Node.js required
- **Package manager**: Deno's built-in (`deno.json` + `deno install`), no
  `package.json`/Yarn

## Getting started

```sh
# 1. Install Deno (macOS via Homebrew, or see https://deno.com)
brew install deno

# 2. Install dependencies (managed by Deno into ./node_modules)
deno install

# 3. Generate the HTTPS certs (once, after clone)
deno task setuphttps

# 4. Start the dev server → http://localhost:5173
deno task dev
```

## Commands

| Command            | What it does                                       |
| ------------------ | -------------------------------------------------- |
| `deno task dev`    | Dev server (Express + Socket.IO + Vite HMR)        |
| `deno task build`  | Production build                                   |
| `deno task start`  | Serve the production build (`server/app/entry.ts`) |
| `deno task lint`   | `deno lint`                                        |
| `deno task check`  | `deno check` (typecheck)                           |
| `deno task fmt`    | `deno fmt`                                         |
| `deno task test`   | `deno test` (built-in runner)                      |
| `deno task verify` | fmt + lint + check + test                          |

## How it works

1. Host uploads a video and opens a room.
2. Receivers join via a `/roomId` share link and name themselves.
3. Socket.IO signaling establishes a peer-to-peer `simple-peer` connection.
4. The host captures the video as a `MediaStream` and streams it to receivers
   over WebRTC.
5. Playback control events flow host → receiver over the peer data channel; the
   video element dispatches `CustomEvent`s that route-level logic listens for
   and relays.

## Repository layout

```
app/
  common/        cross-cutting components, contracts, and logic
  context/Session/  global session state (roomId, userName, role)
  features/      feature-scoped modules (videoPlayback, webRTC, webSocket, toastMessages)
  routes/        React Router flat routes
  utils/         shared helper contracts
server/
  app/           server bootstrap (config, entry, Express + Socket.IO wiring)
  entities/      domain stores (room-store)
  features/      feature handlers (room, chat, reactions, signaling)
  shared/        server-side shared code (logger, socket-utils)
```

See [AGENTS.md](./AGENTS.md) for architecture conventions, naming rules, and the
agent governance that keeps this codebase consistent.
