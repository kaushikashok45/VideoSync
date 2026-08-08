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
| UI direction | Modern dark streaming aesthetic, designed in Phase 2 via `impeccable`, following **Apple Human Interface Guidelines** for the **entire** frontend (not only error UI) |
| Error handling | Standardized, typed errors; fail-fast; recoverable errors always offer a recovery path; user-facing messages are human-readable with a stable error code |

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
| F30 | Dark streaming aesthetic | Full frontend design system following **Apple Human Interface Guidelines**: palette, typography, spacing, motion, component kit, video shell, chat/reactions overlay, error surfaces (§3.4.5), responsive mobile. | P2 |

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

### 3.4 Standardized error handling

Error handling is a first-class, standardized concern with **one error model** used by
the server, the client, and the UI.

#### 3.4.1 Error model (`shared/contracts`)

Every error is a typed object:

```
AppError {
  code: ErrorCode        // stable, machine-readable, e.g. "ROOM_NOT_FOUND"
  message: string        // human-readable, non-technical, actionable
  recovery?: Recovery    // how the user can recover, when recoverable
  detail?: Record<string, unknown>  // structured context for logging
}
```

- `code` is a stable string enum (no magic numbers). Server and client share the enum.
- `message` is written for a person: what happened, why, and what to do — in one or two
  plain sentences. No jargon, no stack traces.
- Error codes are namespaced by domain (see §3.4.3).

#### 3.4.2 Fail-fast principle

- Validate at the boundary immediately. If input or state is invalid, throw a typed
  `AppError` at the first point of failure — do not continue with corrupted state.
- On the client, fail the current action fast and surface it; do not silently swallow.
- On the server, a failed request/event handler rejects with a typed error that is
  serialized and sent back to the caller.
- Unhandled errors are caught once at the boundary (root error boundary / socket
  error handler) and rendered through the standard error UI — never left half-way.

#### 3.4.3 Error code taxonomy

| Domain | Prefix | Examples |
|---|---|---|
| Validation | `VALIDATION_` | `VALIDATION_NAME_EMPTY`, `VALIDATION_CODE_MALFORMED`, `VALIDATION_URL_UNSUPPORTED` |
| Room | `ROOM_` | `ROOM_NOT_FOUND`, `ROOM_FULL`, `ROOM_LOCKED`, `ROOM_ENDED`, `ROOM_PERMISSION_DENIED` |
| Media | `MEDIA_` | `MEDIA_UPLOAD_FAILED`, `MEDIA_CAPTURE_FAILED`, `MEDIA_UNSUPPORTED_CODEC`, `MEDIA_URL_UNPLAYABLE` |
| Sync | `SYNC_` | `SYNC_DRIFT_OUT_OF_BOUNDS`, `SYNC_MEDIA_NOT_READY` |
| Transport | `TRANSPORT_` | `TRANSPORT_DISCONNECTED`, `TRANSPORT_RECONNECT_FAILED`, `TRANSPORT_PEER_FAILED` |
| Server | `SERVER_` | `SERVER_INTERNAL`, `SERVER_RATE_LIMITED`, `SERVER_ROOM_CAPACITY` |

#### 3.4.4 Recoverable vs non-recoverable

Every error declares whether it is **recoverable** and, if so, its **recovery action**:

- **Recoverable** — the error carries a `recovery` descriptor with a concrete user
  action (retry, reconnect, re-join, pick a different source, contact-less retry).
  The UI renders the recovery affordance inline with the message.
  - Transport: auto-reconnect with backoff → "Reconnecting…" state; on final failure a
    **Reconnect** button.
  - Peer failure: retry once, then a "Video degraded" banner + **Retry stream** action.
  - Upload failure: inline error on the picker with **Choose another file**.
  - Drift out of bounds: automatic re-align; if it recurs, banner with **Resync**.
- **Non-recoverable** — the error terminates the current flow:
  - `ROOM_ENDED`: clear explanation + **Back to home**.
  - Unsupported browser/codec: **blocked** screen explaining the requirement.
- When recovery succeeds, the error UI clears; when a recoverable error is left
  unresolved, it stays visible until the user acts or dismisses (if dismissible).

#### 3.4.5 Error UI

Error UI is designed with the rest of the app (Apple HIG) and rendered through
`shared/ui-kit`. There are four graded surfaces:

| Severity | Surface | Used for | Apple HIG guidance |
|---|---|---|---|
| Inline | Field/row error text + icon | Form validation (`VALIDATION_*`) | Inline error under the field; concise; helper text |
| Banner | Persistent dismissible banner | Recoverable media/sync/peer errors | Alert-like, actionable; one primary action |
| Toast | Transient toast | Transient recoverable notices (e.g. "Reconnected") | Short-lived, non-blocking |
| Screen | Full error screen (error boundary) | Blocking/non-recoverable (room ended, transport dead, unsupported) | Clear explanation + guidance; primary action to recover or leave |

**Message content rules (HIG-aligned):**
- **Explain what happened** (state it plainly), **why**, and **what the user can do**.
- Never show raw error codes or stack traces to the user; show the friendly `message`
  and the `code` as a small, subdued, copyable diagnostic line (e.g.
  `Code: ROOM_NOT_FOUND`) for support.
- Keep language calm, specific, and non-blaming. No "Ooops", no exclamation overuse.
- The recovery action is the visible primary button/affordance.

#### 3.4.6 Where errors are caught

- **Server:** each socket handler and route wraps in a typed error boundary; sends
  `{ error: AppError }` to the caller; logs with `detail` via `shared/logger`.
- **Client data layer:** `shared/api` normalizes socket/HTTP errors into `AppError`
  before they reach components.
- **React:** route + root error boundaries render the full-screen surface; feature-level
  errors use inline/banner/toast surfaces via `shared/ui-kit`.

#### 3.4.7 Fail-fast recovery flow (worked example — peer drop)

1. Host detects peer `TRANSPORT_PEER_FAILED` (recoverable, `recovery: reconnect`).
2. Sync engine flags viewer "degraded"; chat unaffected.
3. Client retries once automatically. If success → toast "Reconnected" → state clears.
4. If final failure → persistent banner "We lost the stream for <name> — Retry".
5. If user retries and fails again → banner updates; user can continue watching
   others / return home. Non-blocking.



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

### 4.1b Test coverage depth (mandatory)
Every module's tests cover **all five categories** — never just the happy path:
1. **Happy path** — the intended success flow.
2. **Sad path** — expected failures (validation rejected, not found, permission
   denied, rate-limited, etc.).
3. **Edge cases** — empty/null input, zero values, boundary values, first/last
   items, concurrent/repeated calls.
4. **Mutation cases** — tests that FAIL if the implementation were subtly changed
   (swapping `>`/`>=`, dropping a guard, off-by-one, wrong clamp direction,
   dropping a payload field). Pin the exact behavior of every critical branch.
5. **Logical limits** — capacity limits, rate-limit windows, drift thresholds,
   clamp ranges, max message lengths, reconnect attempts. Test exactly-at-limit
   and just-beyond-limit.

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

### 4.6b File segregation (mandatory)
**One entity / type / function per file.** Do not mix several types, entities, and
functions into a single file.
- Type definitions get their own file (`error-code.ts` for `type ErrorCode`).
- Classes get their own file (`app-error.ts` for `class AppError`).
- Functions get their own file unless they are the single public API of a small
  module owning one responsibility.
- Entities get their own file (`member.ts` for `Member`, not a grab-bag of
  `member` + `room` + `message`).
- Contract modules are directories of small files, not one big `contracts/types.ts`.
  No `utils.ts`/`types.ts`/`helpers.ts` dumping grounds.
- Exception: a tiny private helper used only by one module may live beside it; a
  cohesive enum + its consumer type may share a file only when they are one
  concept (e.g. `MemberRole` inside `member.ts`). When in doubt, split.

### 4.7 Realtime protocol hygiene
- All socket event names and data-channel message types live in shared contracts
  (`shared/contracts/`) as string constants — never inline strings.
- Keep client socket events and server handlers in sync; a contract change must update both sides.
- Payloads are typed and validated at the boundary.

### 4.8 Error handling (mandatory)
- **One error model, everywhere.** Throw/serialize typed `AppError` objects
  (§3.4.1) — never raw strings or bare `Error` with ad-hoc messages.
- **Fail fast.** Validate at the first boundary and throw a typed error immediately.
  Do not continue with invalid or corrupted state. Do not silently swallow errors.
- **Recoverable errors must carry a recovery path.** If it can be recovered, define
  the `recovery` action and surface it in the UI. Never leave a recoverable failure
  with no way forward.
- **User-facing messages are human-readable.** What happened, why, what to do —
  plain language, no jargon, no stack traces. The stable error `code` is shown only
  as a small subdued diagnostic line (e.g. `Code: ROOM_NOT_FOUND`).
- **Errors are caught once at the boundary.** Route/root error boundaries render the
  full-screen surface; feature errors use inline/banner/toast (§3.4.5). No partial,
  half-rendered failure states.
- **Every error code is a tested constant.** Adding an error means adding its enum
  member, its mapping to a friendly message, and its test — all in the same change.

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
2. `shared/contracts` error model (`AppError`, error-code enum) + `shared/logger`.
3. `entities/room-store` + `entities/playback` (pure, TDD).
4. `features/signaling` (join/signal/leave) + shared contracts.
5. `features/room` (create/lock/terminate), `features/chat`, `features/reactions`.
6. Permissions model (grant/revoke/request-approve) in `entities/member`.
7. Error surfaces in `shared/ui-kit` (inline/banner/toast/screen) wired to the error model.
8. Integration + light E2E (including a couple of error-path tests).
9. Client updated to typed contracts (functional, minimal UI).

### Phase 2 — UI
1. FSD frontend restructure + Zustand store wiring.
2. Full design system via `impeccable`, following **Apple Human Interface Guidelines**
   for the entire frontend (palette, type, spacing, motion, components, video shell,
   chat/reactions overlay, error surfaces, responsive mobile).
3. Full visual polish + responsive + HIG consistency pass.

---

## 7. Out of scope (explicit)

- Accounts / auth / persistence.
- SFU (LiveKit).
- Viewer↔viewer media.
- >15 viewers.
- Mobile-native apps.
