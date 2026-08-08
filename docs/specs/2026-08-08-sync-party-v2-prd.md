# The Sync Party v2 — Product Requirements Document (PRD)

- **Status:** Draft for review
- **Date:** 2026-08-08
- **Branch:** `refactor/fsd-rewrite`
- **Type:** Full rewrite (backend first, then UI) into Feature-Sliced Design

---

## 1. Overview

The Sync Party is a realtime synchronized video viewing application. A host starts a
watch party from a local file upload **or** a public video URL; viewers join a room by
code and watch in lock-step. Playback (play/pause/seek/forward/rewind/volume) is
authoritative and drift-corrected. In v2 the entire codebase is rewritten into
Feature-Sliced Design, the realtime backend is rebuilt with a proper sync engine and
room model, and the UI is redesigned around a modern dark streaming aesthetic.

### 1.1 Product decisions (confirmed)

| Decision | Choice |
|---|---|
| Refactor scope | Full rewrite into FSD; backend first, UI second |
| Realtime architecture | Keep P2P WebRTC via `simple-peer` |
| Sync transport | Playback sync on the P2P data channel; chat/reactions/room events on Socket.IO |
| Stream topology | Star: host streams to each viewer |
| Video sources | Both local file upload (WebRTC stream) and public URL (no stream) |
| Room model | Ephemeral, in-memory, host-owned; ends on host disconnect |
| Playback authority | Host = conductor; host can grant control to members (list toggle, everyone-toggle, request/approve) |
| Viewer capability | Private viewing (viewer can pause/seek self without affecting room) |
| Chat | Socket.IO relay, no persistence, rate-limited |
| Capacity | Up to ~15 viewers per room (v1) |
| Deployment | Plain HTTP behind a platform TLS proxy (Render/Fly/Railway) |
| Client state | Zustand for realtime state + React Context for app/session state |
| UI direction | Modern dark streaming aesthetic (designed in Phase 2) |

### 1.2 Goals / Non-goals

**Goals**
- Kill the sync drift and transport bugs of the current event-relay design.
- A backend whose realtime features are testable and maintainable.
- Strict, consistent architecture (FSD) that agents and humans can extend safely.
- Production-ready deployment shape (env-config, health check, TLS-proxy-friendly).

**Non-goals (v1)**
- User accounts / auth.
- Room persistence, history, or favorites.
- SFU (LiveKit) media server.
- Voice/video between viewers (only host→viewer stream).
- >15 viewers per room.
- Offline playback or DVR.

---

## 2. Feature List

### 2.1 Room Lifecycle — `entities/room`, `server/features/room`
| # | Feature | Detail | Priority |
|---|---------|--------|----------|
| F1 | Create room | Host generates short shareable code (e.g. `sync-7xkq2`); server stores room in memory. | P0 |
| F2 | Join room | Viewer enters code (or share link), names self, enters waiting state. | P0 |
| F3 | Room membership | Server tracks host + viewers; broadcasts join/leave to the room. | P0 |
| F4 | Ephemeral, host-owned | Room ends when host disconnects; all viewers notified and returned home. | P0 |
| F5 | Lock room | Host prevents new joins while room is active. | P1 |
| F6 | Rejoin | A dropped viewer reconnects and resumes without a fresh join. | P1 |

### 2.2 Media Source — `features/media-source`
| # | Feature | Detail | Priority |
|---|---------|--------|----------|
| F7 | Upload & stream | Host uploads file → captured `MediaStream` → streamed to viewers over WebRTC. | P0 |
| F8 | URL mode | Host pastes public URL → all peers load it locally; only playback events sync. | P0 |
| F9 | Source handoff | Viewers always receive mode + metadata (url | stream, duration) before playback starts. | P0 |

### 2.3 Playback Sync Engine — `entities/playback`
| # | Feature | Detail | Priority |
|---|---------|--------|----------|
| F10 | Authoritative state | Single source of truth: `{ status, currentTime, duration, rate, updatedAt }`, host-owned, broadcast to viewers. | P0 |
| F11 | Drift correction | Periodic clock-offset + position alignment. | P0 |
| F12 | Sync events | pause/resume/seek/forward/rewind/rate → converge all peers. | P0 |
| F13 | Private viewing | Viewer can pause/seek self only, without affecting the room. | P1 |

### 2.4 Playback Control Authority — `features/playback-control`, `features/room-controls`
| # | Feature | Detail | Priority |
|---|---------|--------|----------|
| F14 | Host = conductor | Host can pause/resume/seek/forward/rewind for everyone. | P0 |
| F15 | Grant control to members | Host grants per-viewer control via members-list toggle. | P0 |
| F16 | Everyone-collaborate | Host toggle granting all current members control. | P1 |
| F17 | Request/approve | Viewer requests control; host approves/denies from a queue. | P1 |
| F18 | Revoke | Host revokes control at any time. | P0 |

### 2.5 Chat — `features/chat`
| # | Feature | Detail | Priority |
|---|---------|--------|----------|
| F19 | Send/receive | Server-relayed text chat with sender name + timestamp. | P0 |
| F20 | Chat entry states | In-room chat box in sidebar; works independent of P2P link health. | P0 |
| F21 | Presence messages | "Alice joined" system messages. | P1 |

### 2.6 Reactions — `features/reactions`
| # | Feature | Detail | Priority |
|---|---------|--------|----------|
| F22 | Emoji reactions | Click emoji (👍 😂 😮 ❤️ 🔥) → overlay floats over video for all. | P0 |
| F23 | Reaction burst | Recent reactions shown as a transient burst, auto-fade. | P1 |

### 2.7 Signaling & Peer Connections — `server/features/signaling`
| # | Feature | Detail | Priority |
|---|---------|--------|----------|
| F24 | Socket.IO signaling | join-room, signal relay (offer/answer/ICE), socket-id-meta, user-joined/left. | P0 |
| F25 | P2P data channel | Host↔viewer data channel for sync + stream-control messages. | P0 |
| F26 | Reconnection | Viewers reconnect after blips; peer connection rebuilt. | P1 |

### 2.8 Production / Ops — `server/app`
| # | Feature | Detail | Priority |
|---|---------|--------|----------|
| F27 | TLS-proxy deployment | Plain HTTP behind platform TLS; env-configurable port/origin. | P0 |
| F28 | Health check | `/healthz` endpoint. | P0 |
| F29 | Env config | Room-code alphabet, rate limits, max room size (15). | P1 |

### 2.9 Visual Redesign (Phase 2) — via `impeccable`
| # | Feature | Detail | Priority |
|---|---------|--------|----------|
| F30 | Dark streaming aesthetic | Palette, typography, component kit, video shell, chat/reactions overlay, responsive mobile. | P2 |

**Priority legend:** P0 = must ship · P1 = strong nice-to-have · P2 = Phase 2 UI.

---

## 3. Architecture

### 3.1 Frontend — Feature-Sliced Design under `app/`
```
app/
  app/              providers, router (react-router v7), root layout, global styles
  pages/            Home, Setup, HostPlayer, ReceiverPlayer, JoinError
  widgets/          PlayerShell, RoomSidebar (chat+members+reactions), MemberList, ReactionOverlay
  features/
    media-source/       upload vs URL picker (host)
    playback-control/   transport controls + permissions-aware actions
    chat/               chat box + message stream
    reactions/          reaction picker + burst overlay
    room-controls/      grant / lock / kick / request-approve (host)
    room-join/          room code entry + self-name
  entities/
    room/               room meta + membership
    member/             viewer/member model + permissions
    playback/           PlaybackState (pure sync engine)
    message/            chat message model
  shared/
    api/                socket-client wrapper (typed events)
    contracts/          shared types (sync protocol, socket events, data-channel messages)
    ui-kit/             Button, TextField, Popover, Modal, Avatar, Toast
    config/             env, constants
    lib/                roomCode, clockOffset, formatting
```

### 3.2 Backend — co-located `server/`, same discipline
```
server/
  app/              http bootstrap, env config, healthz
  features/
    room/           create/join/lock/terminate, room store (in-memory)
    chat/           relay chat messages (rate-limited)
    reactions/      relay reactions
    signaling/      socket.io join/signal/leave relay
  entities/
    room-store/     RoomStore (create, get, delete, membership)
    playback/       authoritative PlaybackState per room (host-owned)
  shared/
    contracts/      event names + payload types (imported by client too)
    logger/         structured logger
```

### 3.3 Data flow (upload mode)
1. Host creates room → `RoomStore.create` → host is owner.
2. Viewer joins via code → `signaling.joinRoom` → server adds member, broadcasts `member-joined`.
3. Host uploads → `MediaStream` captured → host creates a `Peer` per viewer → WebRTC offer/answer via `signaling.signal` → stream flows host→viewer.
4. Data channel opens host↔viewer → carries `playback-sync` messages (state + drift corrections).
5. Playback state lives in `entities/playback` (host-side authoritative). Host actions mutate it; the sync adapter pushes to all viewers over the data channel.
6. Chat/reactions → `socket.emit('chat.message')` → server relays to room → all clients append.
7. Host disconnect → `room-store` terminates room → all viewers get `room.ended` → navigate home.

### 3.4 Error handling
- **Transport:** Socket.IO reconnect with backoff; viewer rejoins room automatically.
- **Sync:** drift correction tolerates bounded skew; viewers wait for `playback.ready` if media loads late.
- **Peer failure:** one retry, then mark viewer "degraded"; chat still works.
- **Room ended:** toast + redirect home.
- **Validation:** server validates room-code format, member names, message length, rate limits.

---

## 4. Agent Guardrails (mandatory)

These rules govern ALL work on this codebase — by agents and humans. **Code hygiene is
the highest priority; never sacrifice it for speed.**

### 4.1 Testing (TDD)
- **Write the failing test first**, then the minimal code to pass it, then refactor
  (red → green → refactor).
- New logic **must** have tests. Pure modules (sync engine, room store, permissions,
  room-code, clock-offset, contracts) are the primary test targets.
- Integration tests cover the signaling/room/chat flows. Light E2E covers the happy
  path (host + viewer join, sync starts).
- `deno task verify` (fmt + lint + check + test) must pass before any work is declared done.

### 4.2 Feature-Sliced Design (FSD)
- **Layer rules (dependency direction):** `shared ← entities ← features ← widgets ← pages ← app`.
  Dependencies only point inward/downward — never outward/upward.
- No cross-imports between two different features; shared code lives in `entities`/`shared`.
- A slice contains its own `ui/`, `model/`, `api/`, `lib/` — keep related code together,
  not scattered by type.
- No business logic in components. No JSX in model/ or api/.

### 4.3 Clean Code
- Small, single-purpose functions and classes with clear names.
- Functions do one thing. Extract when a function exceeds ~10-15 lines or does multiple things.
- Comments explain **why**, never restate what the code says. Remove dead code.
- Favor readability and explicit flow over cleverness or brevity.

### 4.4 SOLID
- **S — Single Responsibility:** each module/class has one reason to change.
- **O — Open/Closed:** extend behavior via composition/strategy, not by editing existing classes.
- **L — Liskov:** subclasses (e.g. `Base*Manager`) must be substitutable for their base.
- **I — Interface Segregation:** small, focused contracts; do not force consumers to depend on methods they don't use.
- **D — Dependency Inversion:** depend on abstractions (contracts/interfaces), not concrete implementations. Inject collaborators (socket, store, peer) rather than instantiating inside.

### 4.5 Tell, Don't Ask
- Objects expose **commands** ("do this") rather than exposing state that callers inspect to decide.
- `PlaybackState.play()` instead of `if (state.status === "paused") state.setStatus("playing")`.
- Encapsulate decisions inside the entity that owns the state. Callers tell it what they want; it decides and acts.

### 4.6 Helper methods & code hygiene
- **No floating helper methods.** Every function lives inside the module/slice that owns its
  responsibility. Shared pure utilities belong in `shared/lib/` and must be typed + tested.
- No "utils" dumping grounds. If a file would be named `utils.ts`, it's a smell — find the real owner.
- One exported responsibility per module by default. Keep module boundaries obvious.
- Public API surfaces (exports, event names, contract types) are deliberate and minimal.
- Consistent naming: `useXBehaviour` for UI hooks, `handleX` for handlers, `*Manager` for
  class managers, `Base*` for abstract bases. Use `Receiver` (not `Reciever`) in new code.
- No `any`. Use `unknown` + narrowing, or precise event types.

### 4.7 Realtime protocol hygiene
- All socket event names and data-channel message types live in shared contracts
  (`shared/contracts/`) as string constants — never inline strings.
- Keep client socket events and server handlers in sync; a contract change must update both sides.
- Payloads are typed and validated at the boundary.

---

## 5. Testing Strategy

| Layer | What | Runner |
|---|---|---|
| Unit | `PlaybackState` sync engine (pure), room-code gen, permissions, clock-offset, contracts | `deno test` |
| Integration | signaling join flow, chat relay, room termination, grant/revoke, rejoin | `deno test` |
| E2E (light) | host creates → viewer joins → stream+sync start (browser automation) | Playwright (via gstack) |

Test files live next to the code (`foo.test.ts` beside `foo.ts`). Use `@std/assert`.

---

## 6. Sequencing

### Phase 1 — Backend (this PRD's first deliverable)
1. `server/` scaffold (app, env, healthz, logger).
2. `entities/room-store` + `entities/playback` (pure, TDD).
3. `features/signaling` (join/signal/leave) + shared contracts.
4. `features/room` (create/lock/terminate), `features/chat`, `features/reactions`.
5. Permissions model (grant/revoke/request-approve) in `entities/member`.
6. Integration + light E2E.
7. Client updated to typed contracts (functional, minimal UI).

### Phase 2 — UI
1. FSD frontend restructure + Zustand store wiring.
2. Design system via `impeccable` (dark streaming aesthetic).
3. Full visual polish + responsive.

---

## 7. Out of scope (explicit)

- Accounts / auth / persistence.
- SFU (LiveKit).
- Viewer↔viewer media.
- >15 viewers.
- Mobile-native apps.
