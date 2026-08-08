# Sync Party v2 — Backend (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild The Sync Party's realtime backend (room lifecycle, signaling, sync engine, chat, reactions, permissions) in a Feature-Sliced `server/` package with a shared typed error model, tested under Deno.

**Architecture:** Feature-Sliced Design. A root `shared/contracts/` layer holds the realtime protocol (error model, socket events, entities, payloads) imported by both `app/` (client) and `server/`. The server is `server/app` (bootstrap) + `server/features` (room, chat, reactions, signaling) + `server/entities` (room-store, playback, member/permissions) + `server/shared` (logger, socket utils). Playback sync is a pure, testable `PlaybackState` engine; socket handlers are thin adapters that translate between typed contracts and socket.io.

**Tech Stack:** Deno 2.x, Socket.IO 4.x, Express 4, React Router v7 (request handler), `simple-peer` (client, unchanged), Deno built-in test runner, `@std/assert`.

## Global Constraints

- **TDD is mandatory** — write the failing test first, then minimal code, then refactor. `deno task verify` (fmt + lint + check + test) must pass at the end of every task.
- **Test coverage depth is mandatory** — every module's tests cover **all five categories**, never just the happy path:
  1. **Happy path** — the intended success flow.
  2. **Sad path** — expected failures (validation rejected, not found, permission denied, rate-limited, etc.).
  3. **Edge cases** — empty/null input, zero values, boundary values, first/last items, concurrent/repeated calls.
  4. **Mutation cases** — tests that FAIL if the implementation were subtly changed (swapping `>`/`>=`, dropping a guard, off-by-one, wrong clamp direction, dropping a payload field). Pin the exact behavior of every critical branch.
  5. **Logical limits** — capacity limits, rate-limit windows, drift thresholds, clamp ranges, max message lengths, reconnect attempts. Test exactly-at-limit and just-beyond-limit.
- **File segregation is mandatory** — one entity / type / function per file. Types get their own file (`error-code.ts` for `type ErrorCode`); classes get their own file (`app-error.ts` for `class AppError`); entities get their own file (`member.ts` for `Member`); payloads get their own file (`room-join-payload.ts`). Contract modules are directories of small files, never one big `contracts/types.ts`. No `utils.ts`/`types.ts`/`helpers.ts` dumping grounds. Exception: a tiny private helper may live beside its sole consumer; a cohesive enum + its consumer type may share a file only when they are one concept (e.g. `MemberRole` inside `member.ts`). When in doubt, split.
- **FSD layer rules** — dependencies point inward only: `shared ← entities ← features ← app`. No cross-imports between features. No business logic in components; no JSX in model/api.
- **Tell, Don't Ask** — objects expose commands (`room.play()`) not state + inspect. Playback and room entities encapsulate their own decisions.
- **No floating helpers** — every function lives in the slice that owns it. Shared pure utilities go in `shared/` and are typed + tested. No `utils.ts` dumping grounds.
- **Error model** — every failure is a typed `AppError` with a stable `code`, human-readable `message`, and a `recovery` action when recoverable. No raw strings, no swallowed errors.
- **Contracts** — all socket event names and data-channel message types are string constants in `shared/contracts`, never inline. Changing a contract updates both sides.
- **Naming** — `handleX` handlers, `useXBehaviour` hooks, `*Manager`/`*Handler` classes, `Base*` abstract. Use `Receiver` (not `Reciever`).
- **No `any`** — use `unknown` + narrowing or precise types.
- **Transport decisions (from PRD)** — sync over P2P data channel (client); chat/reactions/room events over Socket.IO. Server runs **plain HTTP** (localhost is a secure context in browsers; production sits behind a platform TLS proxy).
- `deno.json` already has: `@std/assert`, `socket.io`, `socket.io-client`, `express`, `@react-router/express`, `react-router` imports. Node built-ins use `node:` prefix.
- **Contract import style:** server files import via relative path (`../../../shared/contracts/error-code.ts`); client files import via the `contracts/` alias (`contracts/error-code.ts`).

---

### Task 1: Shared contracts — errors, protocol, entities, payloads (file-segregated)

**Files:** (one unit per file)

Error model:
- Create: `shared/contracts/error-code.ts` — `type ErrorCode` only.
- Create: `shared/contracts/recovery.ts` — `type RecoveryAction` + `type Recovery` (cohesive pair, one concept).
- Create: `shared/contracts/app-error-payload.ts` — `interface AppErrorPayload` only.
- Create: `shared/contracts/error-messages.ts` — `const ERROR_DEFS` + `function errorMessageFor` (one small module owning one API).
- Create: `shared/contracts/app-error.ts` — `class AppError` only.
- Test: `shared/contracts/error.test.ts` — tests the class + message map (one public API).

Protocol constants:
- Create: `shared/contracts/socket-events.ts` — `const SOCKET_EVENTS` only.
- Create: `shared/contracts/data-channel-messages.ts` — `const DATA_CHANNEL_MESSAGES` only.

Entities:
- Create: `shared/contracts/member.ts` — `type MemberRole` + `interface Member`.
- Create: `shared/contracts/media-source.ts` — `type MediaSource` only.
- Create: `shared/contracts/playback.ts` — `type PlaybackStatus` + `interface PlaybackSnapshot`.
- Create: `shared/contracts/room-meta.ts` — `interface RoomMeta` only.
- Create: `shared/contracts/chat-message.ts` — `interface ChatMessage` only.
- Create: `shared/contracts/reaction.ts` — `interface Reaction` only.

Payloads (one per file):
- Create: `shared/contracts/payloads/room-create-payload.ts` — `interface RoomCreatePayload`.
- Create: `shared/contracts/payloads/room-join-payload.ts` — `interface RoomJoinPayload`.
- Create: `shared/contracts/payloads/room-created-payload.ts` — `interface RoomCreatedPayload`.
- Create: `shared/contracts/payloads/room-joined-payload.ts` — `interface RoomJoinedPayload`.
- Create: `shared/contracts/payloads/member-joined-payload.ts` — `interface MemberJoinedPayload`.
- Create: `shared/contracts/payloads/member-left-payload.ts` — `interface MemberLeftPayload`.
- Create: `shared/contracts/payloads/signal-payload.ts` — `interface SignalPayload`.
- Create: `shared/contracts/payloads/relay-signal-payload.ts` — `interface RelaySignalPayload`.
- Create: `shared/contracts/payloads/chat-send-payload.ts` — `interface ChatSendPayload`.
- Create: `shared/contracts/payloads/reaction-send-payload.ts` — `interface ReactionSendPayload`.
- Create: `shared/contracts/payloads/control-grant-payload.ts` — `interface ControlGrantPayload`.
- Create: `shared/contracts/payloads/control-revoke-payload.ts` — `interface ControlRevokePayload`.
- Create: `shared/contracts/payloads/member-control-changed-payload.ts` — `interface MemberControlChangedPayload`.
- Create: `shared/contracts/payloads/control-requested-payload.ts` — `interface ControlRequestedPayload`.

**Interfaces:**
- Produces (exact names later tasks rely on):
  - `error-code.ts`: `export type ErrorCode = "VALIDATION_NAME_EMPTY" | "VALIDATION_CODE_MALFORMED" | "VALIDATION_URL_UNSUPPORTED" | "ROOM_NOT_FOUND" | "ROOM_FULL" | "ROOM_LOCKED" | "ROOM_ENDED" | "ROOM_PERMISSION_DENIED" | "MEDIA_UPLOAD_FAILED" | "MEDIA_CAPTURE_FAILED" | "MEDIA_UNSUPPORTED_CODEC" | "MEDIA_URL_UNPLAYABLE" | "SYNC_DRIFT_OUT_OF_BOUNDS" | "SYNC_MEDIA_NOT_READY" | "TRANSPORT_DISCONNECTED" | "TRANSPORT_RECONNECT_FAILED" | "TRANSPORT_PEER_FAILED" | "SERVER_INTERNAL" | "SERVER_RATE_LIMITED" | "SERVER_ROOM_CAPACITY"`
  - `recovery.ts`: `export type RecoveryAction = { kind: "retry" } | { kind: "reconnect" } | { kind: "rejoin" } | { kind: "home" } | { kind: "choose-source" } | { kind: "resync" }`; `export interface Recovery { label: string; action: RecoveryAction }`.
  - `app-error-payload.ts`: `export interface AppErrorPayload { code: ErrorCode; message: string; recovery?: Recovery; detail?: Record<string, unknown> }`.
  - `error-messages.ts`: `export const ERROR_DEFS: Record<ErrorCode, { message: string; recovery?: Recovery }>`; `export function errorMessageFor(code: ErrorCode): string`.
  - `app-error.ts`: `export class AppError extends Error` with `code`, `message`, `recovery?`, `detail?`, `toJSON(): AppErrorPayload`.
  - `socket-events.ts`: `export const SOCKET_EVENTS` — all room/chat/reaction/control/signal/error event names.
  - `data-channel-messages.ts`: `export const DATA_CHANNEL_MESSAGES`.
  - `member.ts`: `export type MemberRole = "host" | "viewer"`; `export interface Member { id; name; role; canControl; joinedAt }`.
  - `media-source.ts`: `export type MediaSource = { mode: "upload" } | { mode: "url"; url: string }`.
  - `playback.ts`: `export type PlaybackStatus = "playing" | "paused" | "ended"`; `export interface PlaybackSnapshot { status; currentTime; duration; rate; updatedAt }`.
  - `room-meta.ts`: `export interface RoomMeta { code; locked; hostId; memberCount; maxMembers }`.
  - `chat-message.ts`: `export interface ChatMessage { id; senderId; senderName; text; ts }`.
  - `reaction.ts`: `export interface Reaction { senderId; senderName; emoji; ts }`.
  - `payloads/*`: one interface each, matching the event names above.

- [ ] **Step 1: Write the failing tests (all five categories)**

`shared/contracts/error.test.ts`:
```ts
import { assertEquals } from "@std/assert";
import { AppError } from "./app-error.ts";
import { errorMessageFor } from "./error-messages.ts";

// Happy path
Deno.test("AppError carries a stable code and a human message", () => {
  const err = new AppError("ROOM_NOT_FOUND");
  assertEquals(err.code, "ROOM_NOT_FOUND");
  assertEquals(typeof err.message, "string");
  assertEquals(err.message.length > 0, true);
});

// Happy path
Deno.test("errorMessageFor returns a non-empty message for every declared code", () => {
  const codes: string[] = [
    "VALIDATION_NAME_EMPTY", "VALIDATION_CODE_MALFORMED", "VALIDATION_URL_UNSUPPORTED",
    "ROOM_NOT_FOUND", "ROOM_FULL", "ROOM_LOCKED", "ROOM_ENDED", "ROOM_PERMISSION_DENIED",
    "MEDIA_UPLOAD_FAILED", "MEDIA_CAPTURE_FAILED", "MEDIA_UNSUPPORTED_CODEC", "MEDIA_URL_UNPLAYABLE",
    "SYNC_DRIFT_OUT_OF_BOUNDS", "SYNC_MEDIA_NOT_READY",
    "TRANSPORT_DISCONNECTED", "TRANSPORT_RECONNECT_FAILED", "TRANSPORT_PEER_FAILED",
    "SERVER_INTERNAL", "SERVER_RATE_LIMITED", "SERVER_ROOM_CAPACITY",
  ];
  for (const code of codes) {
    assertEquals(errorMessageFor(code as never).length > 0, true, `missing message for ${code}`);
  }
});

// Sad path + mutation: serialization must NOT leak the stack trace
Deno.test("AppError serializes to a plain payload without a stack", () => {
  const err = new AppError("ROOM_PERMISSION_DENIED", { detail: { actorId: "x" } });
  const json = err.toJSON();
  assertEquals(json.code, "ROOM_PERMISSION_DENIED");
  assertEquals(json.detail, { actorId: "x" });
  assertEquals("stack" in json, false);
});

// Mutation case: custom detail must not be overwritten by defaults
Deno.test("custom detail and recovery override defaults", () => {
  const err = new AppError("ROOM_FULL", {
    detail: { memberId: "m1" },
    recovery: { label: "Leave and retry", action: { kind: "retry" } },
  });
  assertEquals(err.detail, { memberId: "m1" });
  assertEquals(err.recovery.label, "Leave and retry");
  assertEquals(err.recovery.action.kind, "retry");
});

// Recoverable errors expose a recovery action; non-recoverable don't
Deno.test("recoverable errors expose a recovery action", () => {
  const err = new AppError("TRANSPORT_PEER_FAILED");
  assertEquals(err.recovery?.action.kind, "retry");
  assertEquals(typeof err.recovery.label, "string");
});

Deno.test("non-recoverable errors have no recovery", () => {
  const err = new AppError("MEDIA_UNSUPPORTED_CODEC");
  assertEquals(err.recovery, undefined);
});

// Edge: message falls back to the canonical human map
Deno.test("AppError.message equals the canonical human message", () => {
  const err = new AppError("ROOM_LOCKED");
  assertEquals(err.message, errorMessageFor("ROOM_LOCKED"));
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `deno test shared/contracts/error.test.ts --sloppy-imports`
Expected: FAIL — module `./app-error.ts` not found.

- [ ] **Step 3: Implement the error model, file by file**

`shared/contracts/error-code.ts`:
```ts
export type ErrorCode =
  | "VALIDATION_NAME_EMPTY"
  | "VALIDATION_CODE_MALFORMED"
  | "VALIDATION_URL_UNSUPPORTED"
  | "ROOM_NOT_FOUND"
  | "ROOM_FULL"
  | "ROOM_LOCKED"
  | "ROOM_ENDED"
  | "ROOM_PERMISSION_DENIED"
  | "MEDIA_UPLOAD_FAILED"
  | "MEDIA_CAPTURE_FAILED"
  | "MEDIA_UNSUPPORTED_CODEC"
  | "MEDIA_URL_UNPLAYABLE"
  | "SYNC_DRIFT_OUT_OF_BOUNDS"
  | "SYNC_MEDIA_NOT_READY"
  | "TRANSPORT_DISCONNECTED"
  | "TRANSPORT_RECONNECT_FAILED"
  | "TRANSPORT_PEER_FAILED"
  | "SERVER_INTERNAL"
  | "SERVER_RATE_LIMITED"
  | "SERVER_ROOM_CAPACITY";
```

`shared/contracts/recovery.ts`:
```ts
export type RecoveryAction =
  | { kind: "retry" }
  | { kind: "reconnect" }
  | { kind: "rejoin" }
  | { kind: "home" }
  | { kind: "choose-source" }
  | { kind: "resync" };

export interface Recovery {
  label: string;
  action: RecoveryAction;
}
```

`shared/contracts/app-error-payload.ts`:
```ts
import type { ErrorCode } from "./error-code.ts";
import type { Recovery } from "./recovery.ts";

export interface AppErrorPayload {
  code: ErrorCode;
  message: string;
  recovery?: Recovery;
  detail?: Record<string, unknown>;
}
```

`shared/contracts/error-messages.ts`:
```ts
import type { ErrorCode } from "./error-code.ts";
import type { Recovery } from "./recovery.ts";

export const ERROR_DEFS: Record<ErrorCode, { message: string; recovery?: Recovery }> = {
  VALIDATION_NAME_EMPTY: { message: "Please enter a name before continuing." },
  VALIDATION_CODE_MALFORMED: { message: "That room code isn't valid. Check it and try again." },
  VALIDATION_URL_UNSUPPORTED: { message: "That link can't be played here. Try a different video URL." },
  ROOM_NOT_FOUND: { message: "We couldn't find that room. The code may be wrong or the party may have ended.", recovery: { label: "Back to home", action: { kind: "home" } } },
  ROOM_FULL: { message: "That room is full. Try again later." },
  ROOM_LOCKED: { message: "That room is locked. Ask the host to unlock it." },
  ROOM_ENDED: { message: "The host ended the party.", recovery: { label: "Back to home", action: { kind: "home" } } },
  ROOM_PERMISSION_DENIED: { message: "You don't have permission to do that." },
  MEDIA_UPLOAD_FAILED: { message: "The file couldn't be uploaded.", recovery: { label: "Choose another file", action: { kind: "choose-source" } } },
  MEDIA_CAPTURE_FAILED: { message: "We couldn't capture the video from your file." },
  MEDIA_UNSUPPORTED_CODEC: { message: "That file's format isn't supported by your browser." },
  MEDIA_URL_UNPLAYABLE: { message: "That video couldn't start playing.", recovery: { label: "Try a different link", action: { kind: "choose-source" } } },
  SYNC_DRIFT_OUT_OF_BOUNDS: { message: "Your video got out of sync.", recovery: { label: "Resync", action: { kind: "resync" } } },
  SYNC_MEDIA_NOT_READY: { message: "Waiting for the video to be ready." },
  TRANSPORT_DISCONNECTED: { message: "You were disconnected.", recovery: { label: "Reconnect", action: { kind: "reconnect" } } },
  TRANSPORT_RECONNECT_FAILED: { message: "We couldn't reconnect. Check your connection.", recovery: { label: "Reconnect", action: { kind: "reconnect" } } },
  TRANSPORT_PEER_FAILED: { message: "The stream to one viewer was lost.", recovery: { label: "Retry", action: { kind: "retry" } } },
  SERVER_INTERNAL: { message: "Something went wrong on our end. Please try again." },
  SERVER_RATE_LIMITED: { message: "That was sent too quickly. Please slow down." },
  SERVER_ROOM_CAPACITY: { message: "This room is at capacity." },
};

export function errorMessageFor(code: ErrorCode): string {
  return ERROR_DEFS[code].message;
}
```

`shared/contracts/app-error.ts`:
```ts
import type { AppErrorPayload } from "./app-error-payload.ts";
import type { ErrorCode } from "./error-code.ts";
import { ERROR_DEFS } from "./error-messages.ts";
import type { Recovery } from "./recovery.ts";

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly recovery?: Recovery;
  readonly detail?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    opts: { recovery?: Recovery; detail?: Record<string, unknown> } = {},
  ) {
    super(ERROR_DEFS[code].message);
    this.name = "AppError";
    this.code = code;
    this.recovery = opts.recovery ?? ERROR_DEFS[code].recovery;
    this.detail = opts.detail;
  }

  toJSON(): AppErrorPayload {
    return {
      code: this.code,
      message: this.message,
      recovery: this.recovery,
      detail: this.detail,
    };
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `deno test shared/contracts/error.test.ts --sloppy-imports`
Expected: 7 passing.

- [ ] **Step 5: Implement the protocol constants, file by file**

`shared/contracts/socket-events.ts`:
```ts
export const SOCKET_EVENTS = {
  ROOM_CREATE: "room:create",
  ROOM_JOIN: "room:join",
  ROOM_LOCK: "room:lock",
  ROOM_UNLOCK: "room:unlock",
  ROOM_LEAVE: "room:leave",
  SIGNAL: "signal",
  CHAT_SEND: "chat:send",
  REACTION_SEND: "reaction:send",
  CONTROL_GRANT: "control:grant",
  CONTROL_REVOKE: "control:revoke",
  CONTROL_REQUEST: "control:request",
  CONTROL_APPROVE: "control:approve",
  ROOM_CREATED: "room:created",
  ROOM_JOINED: "room:joined",
  ROOM_ENDED: "room:ended",
  ROOM_LOCKED: "room:locked",
  ROOM_UNLOCKED: "room:unlocked",
  MEMBER_JOINED: "member:joined",
  MEMBER_LEFT: "member:left",
  MEMBER_CONTROL_CHANGED: "member:control:changed",
  CONTROL_REQUESTED: "control:requested",
  CHAT_MESSAGE: "chat:message",
  REACTION: "reaction",
  SOCKET_ID_META: "socket-id-meta",
  APP_ERROR: "app:error",
} as const;
```

`shared/contracts/data-channel-messages.ts`:
```ts
export const DATA_CHANNEL_MESSAGES = {
  SYNC_STATE: "sync:state",
  SYNC_COMMAND: "sync:command",
  SYNC_DRIFT: "sync:drift",
  MEDIA_READY: "media:ready",
} as const;
```

- [ ] **Step 6: Implement the entities, file by file**

`shared/contracts/member.ts`:
```ts
export type MemberRole = "host" | "viewer";

export interface Member {
  id: string;
  name: string;
  role: MemberRole;
  canControl: boolean;
  joinedAt: number;
}
```

`shared/contracts/media-source.ts`:
```ts
export type MediaSource = { mode: "upload" } | { mode: "url"; url: string };
```

`shared/contracts/playback.ts`:
```ts
export type PlaybackStatus = "playing" | "paused" | "ended";

export interface PlaybackSnapshot {
  status: PlaybackStatus;
  currentTime: number;
  duration: number;
  rate: number;
  updatedAt: number;
}
```

`shared/contracts/room-meta.ts`:
```ts
export interface RoomMeta {
  code: string;
  locked: boolean;
  hostId: string;
  memberCount: number;
  maxMembers: number;
}
```

`shared/contracts/chat-message.ts`:
```ts
export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  ts: number;
}
```

`shared/contracts/reaction.ts`:
```ts
export interface Reaction {
  senderId: string;
  senderName: string;
  emoji: string;
  ts: number;
}
```

- [ ] **Step 7: Implement the payloads, one file each**

`shared/contracts/payloads/room-create-payload.ts`:
```ts
export interface RoomCreatePayload {
  name: string;
}
```

`shared/contracts/payloads/room-join-payload.ts`:
```ts
export interface RoomJoinPayload {
  code: string;
  name: string;
}
```

`shared/contracts/payloads/room-created-payload.ts`:
```ts
import type { RoomMeta } from "../room-meta.ts";

export interface RoomCreatedPayload {
  room: RoomMeta;
}
```

`shared/contracts/payloads/room-joined-payload.ts`:
```ts
import type { Member } from "../member.ts";
import type { RoomMeta } from "../room-meta.ts";

export interface RoomJoinedPayload {
  room: RoomMeta;
  members: Member[];
}
```

`shared/contracts/payloads/member-joined-payload.ts`:
```ts
import type { Member } from "../member.ts";

export interface MemberJoinedPayload {
  member: Member;
}
```

`shared/contracts/payloads/member-left-payload.ts`:
```ts
export interface MemberLeftPayload {
  memberId: string;
}
```

`shared/contracts/payloads/signal-payload.ts`:
```ts
export interface SignalPayload {
  to: string;
  signalData: unknown;
}
```

`shared/contracts/payloads/relay-signal-payload.ts`:
```ts
export interface RelaySignalPayload {
  peerId: string;
  signalData: unknown;
}
```

`shared/contracts/payloads/chat-send-payload.ts`:
```ts
export interface ChatSendPayload {
  text: string;
  senderName: string;
}
```

`shared/contracts/payloads/reaction-send-payload.ts`:
```ts
export interface ReactionSendPayload {
  emoji: string;
  senderName: string;
}
```

`shared/contracts/payloads/control-grant-payload.ts`:
```ts
export interface ControlGrantPayload {
  targetId: string;
}
```

`shared/contracts/payloads/control-revoke-payload.ts`:
```ts
export interface ControlRevokePayload {
  targetId: string;
}
```

`shared/contracts/payloads/member-control-changed-payload.ts`:
```ts
export interface MemberControlChangedPayload {
  memberId: string;
  canControl: boolean;
}
```

`shared/contracts/payloads/control-requested-payload.ts`:
```ts
import type { Member } from "../member.ts";

export interface ControlRequestedPayload {
  requestId: string;
  member: Member;
}
```

- [ ] **Step 8: Run the whole shared-contract suite**

Run: `deno test shared/contracts/ --sloppy-imports`
Expected: 7 passing (error model). Payload/entity files are type-only — `deno check shared/contracts --sloppy-imports` must pass with no errors.

- [ ] **Step 9: Commit**

```bash
git add shared/contracts/
git commit -m "Feat: adds file-segregated shared error model, protocol constants, entities, and payloads"
```

---

### Task 2: Room code generator

**Files:**
- Create: `server/entities/room-store/room-code.ts` — `generateRoomCode` + `isValidRoomCode` (one module, one responsibility).
- Test: `server/entities/room-store/room-code.test.ts`

**Interfaces:**
- Produces: `generateRoomCode(length?: number): string` (alphabet `abcdefghjkmnpqrstuvwxyz23456789`) and `isValidRoomCode(code: string, length?: number): boolean`.

- [ ] **Step 1: Write the failing tests (all five categories)**

`server/entities/room-store/room-code.test.ts`:
```ts
import { assertEquals } from "@std/assert";
import { generateRoomCode, isValidRoomCode } from "./room-code.ts";

// Happy path
Deno.test("generateRoomCode returns a code of the requested length", () => {
  assertEquals(generateRoomCode(5).length, 5);
  assertEquals(generateRoomCode(7).length, 7);
});

// Happy path + mutation: alphabet must exclude ambiguous characters
Deno.test("generateRoomCode avoids ambiguous characters", () => {
  for (let i = 0; i < 100; i++) {
    const code = generateRoomCode();
    assertEquals(/^[abcdefghjkmnpqrstuvwxyz23456789]+$/.test(code), true);
  }
});

// Edge: default length is 5; repeated calls vary
Deno.test("generateRoomCode defaults to length 5 and produces varied codes", () => {
  const seen = new Set<string>();
  for (let i = 0; i < 50; i++) seen.add(generateRoomCode());
  assertEquals(generateRoomCode().length, 5);
  assertEquals(seen.size > 1, true);
});

// Sad path
Deno.test("isValidRoomCode rejects malformed, wrong-length, and ambiguous codes", () => {
  assertEquals(isValidRoomCode("ABCDE"), false); // uppercase
  assertEquals(isValidRoomCode("abcd"), false); // too short
  assertEquals(isValidRoomCode(""), false); // empty
  assertEquals(isValidRoomCode("ab1de"), false); // digit 1 excluded
  assertEquals(isValidRoomCode("abode"), false); // 'o' excluded
});

// Happy path + logical limit: exactly at length and just beyond
Deno.test("isValidRoomCode accepts exactly-at-length and rejects beyond", () => {
  assertEquals(isValidRoomCode("abcde", 5), true); // at limit
  assertEquals(isValidRoomCode("abcdef", 5), false); // beyond limit
  assertEquals(isValidRoomCode("abc", 5), false); // under limit
});

// Mutation case: whitespace is not silently accepted
Deno.test("isValidRoomCode rejects codes with whitespace", () => {
  assertEquals(isValidRoomCode("abc e"), false);
  assertEquals(isValidRoomCode("abcde "), false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `deno test server/entities/room-store/room-code.test.ts --sloppy-imports`
Expected: FAIL — module `./room-code.ts` not found.

- [ ] **Step 3: Implement**

`server/entities/room-store/room-code.ts`:
```ts
const ALPHABET = "abcdefghjkmnpqrstuvwxyz23456789";

export function generateRoomCode(length = 5): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    const idx = Math.floor(Math.random() * ALPHABET.length);
    out += ALPHABET[idx];
  }
  return out;
}

export function isValidRoomCode(code: string, length = 5): boolean {
  if (typeof code !== "string") return false;
  if (code.length !== length) return false;
  return [...code].every((ch) => ALPHABET.includes(ch));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `deno test server/entities/room-store/room-code.test.ts --sloppy-imports`
Expected: 6 passing.

- [ ] **Step 5: Commit**

```bash
git add server/entities/room-store/room-code.ts server/entities/room-store/room-code.test.ts
git commit -m "Feat: adds room code generator and validator"
```

---

### Task 3: RoomStore entity

**Files:**
- Create: `server/entities/room-store/room.ts` — `interface Room` only (entity file).
- Create: `server/entities/room-store/room-store.ts` — `class RoomStore` only.
- Test: `server/entities/room-store/room-store.test.ts`

**Interfaces:**
- Consumes: `generateRoomCode`, `isValidRoomCode` (Task 2); `AppError` (Task 1); `Member`, `MediaSource`, `PlaybackSnapshot`, `RoomMeta` (Task 1).
- Produces:
  - `room.ts`: `export interface Room { code; hostId; locked; members: Map<string, Member>; mediaSource: MediaSource | null; playback: PlaybackSnapshot; createdAt }`.
  - `room-store.ts`: `class RoomStore` with `create(hostId, hostName): Room`, `get(code): Room | undefined`, `getOrThrow(code): Room`, `delete(code): void`, `addMember(room, member): void`, `removeMember(room, memberId): Member | undefined`, `memberCount(room): number`, `toMeta(room): RoomMeta`.

- [ ] **Step 1: Write the failing tests (all five categories)**

`server/entities/room-store/room-store.test.ts`:
```ts
import { assertEquals, assertRejects } from "@std/assert";
import { RoomStore } from "./room-store.ts";
import { AppError } from "../../../shared/contracts/app-error.ts";
import type { Member } from "../../../shared/contracts/member.ts";

const now = () => 1000;
const opts = { maxMembers: 15, now, codeLength: 5 };

function viewer(id: string, name: string): Member {
  return { id, name, role: "viewer", canControl: false, joinedAt: now() };
}

// Happy path
Deno.test("create stores a host-owned room and assigns a valid code", () => {
  const store = new RoomStore(opts);
  const room = store.create("sock-1", "Alice");
  assertEquals(room.hostId, "sock-1");
  assertEquals(store.get(room.code)?.hostId, "sock-1");
  assertEquals(room.members.get("sock-1")?.role, "host");
  assertEquals(room.members.get("sock-1")?.canControl, true);
  assertEquals(store.memberCount(room), 1);
});

// Sad path
Deno.test("create rejects an empty or whitespace host name", () => {
  const store = new RoomStore(opts);
  assertRejects(
    () => Promise.resolve().then(() => store.create("sock-1", "   ")),
    AppError,
    "name",
  );
});

// Sad path
Deno.test("get returns undefined for unknown or malformed codes", () => {
  const store = new RoomStore(opts);
  assertEquals(store.get("zzzzz"), undefined);
  assertEquals(store.get("!!!"), undefined);
});

// Logical limit: exactly at capacity passes, beyond throws
Deno.test("addMember enforces the exact capacity boundary", () => {
  const store = new RoomStore(opts);
  const room = store.create("host", "H");
  for (let i = 0; i < 14; i++) store.addMember(room, viewer(`v${i}`, `v${i}`));
  assertEquals(store.memberCount(room), 15); // at limit
  assertRejects(
    () => Promise.resolve().then(() => store.addMember(room, viewer("extra", "x"))),
    AppError,
    "full",
  );
});

// Sad path + mutation: locking must reject new viewers but allow host
Deno.test("addMember rejects joining a locked room as a viewer, allows host", () => {
  const store = new RoomStore(opts);
  const room = store.create("host", "H");
  room.locked = true;
  assertRejects(
    () => Promise.resolve().then(() => store.addMember(room, viewer("v1", "V"))),
    AppError,
    "locked",
  );
  store.addMember(room, { ...viewer("h2", "H2"), role: "host" });
  assertEquals(store.memberCount(room), 2);
});

// Edge: re-adding an existing member is a no-op (no double count)
Deno.test("addMember is idempotent for an existing member id", () => {
  const store = new RoomStore(opts);
  const room = store.create("host", "H");
  const v = viewer("v1", "V");
  store.addMember(room, v);
  store.addMember(room, v);
  assertEquals(store.memberCount(room), 2);
});

// Happy path + edge: remove returns the removed member; removing unknown is undefined
Deno.test("removeMember removes and returns the member; unknown id returns undefined", () => {
  const store = new RoomStore(opts);
  const room = store.create("host", "H");
  store.addMember(room, viewer("v1", "V"));
  assertEquals(store.removeMember(room, "v1")?.id, "v1");
  assertEquals(store.memberCount(room), 1);
  assertEquals(store.removeMember(room, "v1"), undefined);
});

// Mutation case: delete removes the room from lookup
Deno.test("delete removes the room entirely", () => {
  const store = new RoomStore(opts);
  const room = store.create("host", "H");
  store.delete(room.code);
  assertEquals(store.get(room.code), undefined);
});

// Mutation case: toMeta reflects the exact membership and flags
Deno.test("toMeta reflects membership count, lock, host, and capacity", () => {
  const store = new RoomStore(opts);
  const room = store.create("host", "H");
  store.addMember(room, viewer("v1", "V"));
  room.locked = true;
  const meta = store.toMeta(room);
  assertEquals(meta.hostId, "host");
  assertEquals(meta.memberCount, 2);
  assertEquals(meta.maxMembers, 15);
  assertEquals(meta.locked, true);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `deno test server/entities/room-store/room-store.test.ts --sloppy-imports`
Expected: FAIL — module `./room-store.ts` not found.

- [ ] **Step 3: Implement**

`server/entities/room-store/room.ts`:
```ts
import type { MediaSource } from "../../../shared/contracts/media-source.ts";
import type { Member } from "../../../shared/contracts/member.ts";
import type { PlaybackSnapshot } from "../../../shared/contracts/playback.ts";

export interface Room {
  code: string;
  hostId: string;
  locked: boolean;
  members: Map<string, Member>;
  mediaSource: MediaSource | null;
  playback: PlaybackSnapshot;
  createdAt: number;
}
```

`server/entities/room-store/room-store.ts`:
```ts
import { AppError } from "../../../shared/contracts/app-error.ts";
import type { Member } from "../../../shared/contracts/member.ts";
import type { RoomMeta } from "../../../shared/contracts/room-meta.ts";
import type { Room } from "./room.ts";
import { generateRoomCode, isValidRoomCode } from "./room-code.ts";

export interface RoomStoreDeps {
  maxMembers: number;
  now: () => number;
  codeLength?: number;
  createCode?: (length: number) => string;
}

export class RoomStore {
  private rooms = new Map<string, Room>();

  constructor(private deps: RoomStoreDeps) {}

  create(hostId: string, hostName: string): Room {
    const name = hostName?.trim() ?? "";
    if (name === "") throw new AppError("VALIDATION_NAME_EMPTY");
    const code = this.uniqueCode();
    const room: Room = {
      code,
      hostId,
      locked: false,
      members: new Map(),
      mediaSource: null,
      playback: {
        status: "paused",
        currentTime: 0,
        duration: 0,
        rate: 1,
        updatedAt: this.deps.now(),
      },
      createdAt: this.deps.now(),
    };
    room.members.set(hostId, {
      id: hostId,
      name,
      role: "host",
      canControl: true,
      joinedAt: this.deps.now(),
    });
    this.rooms.set(code, room);
    return room;
  }

  private uniqueCode(): string {
    const length = this.deps.codeLength ?? 5;
    const generate = this.deps.createCode ?? generateRoomCode;
    let code = generate(length);
    while (this.rooms.has(code)) code = generate(length);
    return code;
  }

  get(code: string): Room | undefined {
    if (!isValidRoomCode(code, this.deps.codeLength ?? 5)) return undefined;
    return this.rooms.get(code);
  }

  getOrThrow(code: string): Room {
    const room = this.get(code);
    if (!room) throw new AppError("ROOM_NOT_FOUND");
    return room;
  }

  delete(code: string): void {
    this.rooms.delete(code);
  }

  addMember(room: Room, member: Member): void {
    if (room.members.has(member.id)) return;
    if (room.members.size >= this.deps.maxMembers) {
      throw new AppError("ROOM_FULL");
    }
    if (room.locked && member.role !== "host") {
      throw new AppError("ROOM_LOCKED");
    }
    room.members.set(member.id, member);
  }

  removeMember(room: Room, memberId: string): Member | undefined {
    const member = room.members.get(memberId);
    room.members.delete(memberId);
    return member;
  }

  memberCount(room: Room): number {
    return room.members.size;
  }

  toMeta(room: Room): RoomMeta {
    return {
      code: room.code,
      locked: room.locked,
      hostId: room.hostId,
      memberCount: room.members.size,
      maxMembers: this.deps.maxMembers,
    };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `deno test server/entities/room-store/room-store.test.ts --sloppy-imports`
Expected: 9 passing.

- [ ] **Step 5: Commit**

```bash
git add server/entities/room-store/room.ts server/entities/room-store/room-store.ts server/entities/room-store/room-store.test.ts
git commit -m "Feat: adds in-memory RoomStore with capacity and lock enforcement"
```

---

### Task 4: PlaybackState sync engine

**Files:**
- Create: `server/entities/playback/playback-state.ts` — `class PlaybackState` + `interface PlaybackDeps` (class + its DI contract, one module).
- Test: `server/entities/playback/playback-state.test.ts`

**Interfaces:**
- Consumes: `PlaybackSnapshot`, `PlaybackStatus` (Task 1).
- Produces: `class PlaybackState` with deps `{ now(): number; driftThresholdMs: number; seekStepSeconds: number }`, constructor `(deps, initial: PlaybackSnapshot)`, methods `getSnapshot()`, `play()`, `pause()`, `seek(time)`, `forward(step?)`, `rewind(step?)`, `setDuration(duration)`, `projected(now)`, `driftMs(viewerPositionMs, now)`, `isDriftAcceptable(driftMs)`, and `get status(): PlaybackStatus`. All control methods return the projected `PlaybackSnapshot`.

- [ ] **Step 1: Write the failing tests (all five categories)**

`server/entities/playback/playback-state.test.ts`:
```ts
import { assertEquals } from "@std/assert";
import { PlaybackState } from "./playback-state.ts";
import type { PlaybackSnapshot } from "../../../shared/contracts/playback.ts";

function makeState(overrides: Partial<PlaybackSnapshot> = {}) {
  const t0 = 100_000;
  const initial: PlaybackSnapshot = {
    status: "paused",
    currentTime: 0,
    duration: 120,
    rate: 1,
    updatedAt: t0,
    ...overrides,
  };
  let clock = t0;
  const state = new PlaybackState(
    { now: () => clock, driftThresholdMs: 1500, seekStepSeconds: 10 },
    initial,
  );
  return { state, setTime: (t: number) => { clock = t; } };
}

// Happy path: paused does not advance
Deno.test("paused state does not advance over time", () => {
  const { state, setTime } = makeState({ status: "paused", currentTime: 30 });
  setTime(101_000);
  assertEquals(state.getSnapshot().currentTime, 30);
});

// Happy path: playing projects forward at rate
Deno.test("playing state projects currentTime forward at rate", () => {
  const { state, setTime } = makeState({ status: "playing", currentTime: 30, rate: 1 });
  setTime(102_000);
  assertEquals(state.getSnapshot().currentTime, 32);
});

// Edge: rate > 1 accelerates projection
Deno.test("rate scales the projected elapsed time", () => {
  const { state, setTime } = makeState({ status: "playing", currentTime: 30, rate: 2 });
  setTime(101_000); // +1s at 2x
  assertEquals(state.getSnapshot().currentTime, 32);
});

// Mutation case: pause freezes at the projected time, not the stored time
Deno.test("pause freezes at the projected time", () => {
  const { state, setTime } = makeState({ status: "playing", currentTime: 30 });
  setTime(101_500);
  const snap = state.pause();
  assertEquals(snap.status, "paused");
  assertEquals(snap.currentTime, 31.5);
});

// Logical limit: seek clamps to [0, duration]
Deno.test("seek clamps to duration and zero bounds", () => {
  const { state } = makeState({ status: "paused", currentTime: 30, duration: 120 });
  assertEquals(state.seek(500).currentTime, 120);
  assertEquals(state.seek(-5).currentTime, 0);
  assertEquals(state.seek(50).currentTime, 50);
});

// Happy path: forward/rewind step by configured seconds
Deno.test("forward and rewind step by configured seconds", () => {
  const { state } = makeState({ status: "paused", currentTime: 50 });
  assertEquals(state.forward().currentTime, 60);
  assertEquals(state.rewind().currentTime, 50);
});

// Mutation case: forward clamps at duration, rewind clamps at zero
Deno.test("forward/rewind respect the duration and zero bounds", () => {
  const { state } = makeState({ status: "paused", currentTime: 118, duration: 120 });
  assertEquals(state.forward().currentTime, 120);
  const zero = makeState({ status: "paused", currentTime: 3, duration: 120 });
  assertEquals(zero.state.rewind().currentTime, 0);
});

// Edge: seek while playing resumes advancing from the new position
Deno.test("playing + seek resumes advancing from the new position", () => {
  const { state, setTime } = makeState({ status: "playing", currentTime: 10 });
  setTime(100_500);
  state.seek(20);
  setTime(101_000);
  assertEquals(state.getSnapshot().currentTime, 20.5);
});

// Edge: ended state ignores play
Deno.test("play is a no-op when ended", () => {
  const { state } = makeState({ status: "ended", currentTime: 120 });
  assertEquals(state.play().status, "ended");
});

// Happy path + mutation: drift is signed and relative to authoritative position
Deno.test("drift detection reports signed difference", () => {
  const { state } = makeState({ status: "playing", currentTime: 30 });
  assertEquals(state.driftMs(28_800, 100_000), -1200);
});

// Logical limit: exactly-at-threshold acceptable, just-beyond not
Deno.test("drift acceptability respects the exact threshold", () => {
  const { state } = makeState({});
  assertEquals(state.isDriftAcceptable(1500), true);
  assertEquals(state.isDriftAcceptable(1501), false);
  assertEquals(state.isDriftAcceptable(-1500), true);
});

// Edge: setDuration updates the ceiling for projection
Deno.test("setDuration caps projection at the new duration", () => {
  const { state, setTime } = makeState({ status: "playing", currentTime: 100, duration: 120 });
  state.setDuration(101);
  setTime(102_000); // would reach 102 without the cap
  assertEquals(state.getSnapshot().currentTime, 101);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `deno test server/entities/playback/playback-state.test.ts --sloppy-imports`
Expected: FAIL — module `./playback-state.ts` not found.

- [ ] **Step 3: Implement**

`server/entities/playback/playback-state.ts`:
```ts
import type {
  PlaybackSnapshot,
  PlaybackStatus,
} from "../../../shared/contracts/playback.ts";

export interface PlaybackDeps {
  now: () => number;
  driftThresholdMs: number;
  seekStepSeconds: number;
}

export class PlaybackState {
  private snapshot: PlaybackSnapshot;

  constructor(private deps: PlaybackDeps, initial: PlaybackSnapshot) {
    this.snapshot = initial;
  }

  getSnapshot(): PlaybackSnapshot {
    return this.projected(this.deps.now());
  }

  play(): PlaybackSnapshot {
    if (this.snapshot.status === "ended") return this.getSnapshot();
    this.snapshot = { ...this.snapshot, status: "playing", updatedAt: this.deps.now() };
    return this.getSnapshot();
  }

  pause(): PlaybackSnapshot {
    this.snapshot = {
      ...this.projected(this.deps.now()),
      status: "paused",
      updatedAt: this.deps.now(),
    };
    return this.getSnapshot();
  }

  seek(time: number): PlaybackSnapshot {
    const clamped = Math.max(0, Math.min(time, this.snapshot.duration || time));
    this.snapshot = { ...this.snapshot, currentTime: clamped, updatedAt: this.deps.now() };
    return this.getSnapshot();
  }

  forward(step = this.deps.seekStepSeconds): PlaybackSnapshot {
    return this.seek(this.projected(this.deps.now()).currentTime + step);
  }

  rewind(step = this.deps.seekStepSeconds): PlaybackSnapshot {
    return this.seek(this.projected(this.deps.now()).currentTime - step);
  }

  setDuration(duration: number): PlaybackSnapshot {
    this.snapshot = { ...this.snapshot, duration };
    return this.getSnapshot();
  }

  projected(now: number): PlaybackSnapshot {
    if (this.snapshot.status !== "playing") return this.snapshot;
    const elapsedSec = Math.max(0, (now - this.snapshot.updatedAt) / 1000) * this.snapshot.rate;
    const duration = this.snapshot.duration || Number.POSITIVE_INFINITY;
    const currentTime = Math.min(this.snapshot.currentTime + elapsedSec, duration);
    return { ...this.snapshot, currentTime };
  }

  driftMs(viewerPositionMs: number, now: number): number {
    return viewerPositionMs - this.projected(now).currentTime * 1000;
  }

  isDriftAcceptable(driftMs: number): boolean {
    return Math.abs(driftMs) <= this.deps.driftThresholdMs;
  }

  get status(): PlaybackStatus {
    return this.snapshot.status;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `deno test server/entities/playback/playback-state.test.ts --sloppy-imports`
Expected: 13 passing.

- [ ] **Step 5: Commit**

```bash
git add server/entities/playback/playback-state.ts server/entities/playback/playback-state.test.ts
git commit -m "Feat: adds pure PlaybackState sync engine with drift detection"
```

---

### Task 5: Permissions model

**Files:**
- Create: `server/entities/member/permissions.ts` — the permission functions (one module, one responsibility).
- Test: `server/entities/member/permissions.test.ts`

**Interfaces:**
- Consumes: `Member` (Task 1), `AppError` (Task 1).
- Produces: `isHost(member): boolean`, `canControlRoom(member): boolean`, `assertCanControl(member): void`, `grantControl(actor, target): void`, `revokeControl(actor, target): void`.

- [ ] **Step 1: Write the failing tests (all five categories)**

`server/entities/member/permissions.test.ts`:
```ts
import { assertEquals, assertThrows } from "@std/assert";
import { AppError } from "../../../shared/contracts/app-error.ts";
import type { Member } from "../../../shared/contracts/member.ts";
import {
  assertCanControl,
  canControlRoom,
  grantControl,
  isHost,
  revokeControl,
} from "./permissions.ts";

function member(over: Partial<Member> = {}): Member {
  return { id: "m1", name: "M", role: "viewer", canControl: false, joinedAt: 0, ...over };
}

// Happy path
Deno.test("host can always control the room", () => {
  const host = member({ role: "host" });
  assertEquals(isHost(host), true);
  assertEquals(canControlRoom(host), true);
});

// Happy path + edge
Deno.test("viewer with canControl flag can control the room; plain viewer cannot", () => {
  assertEquals(canControlRoom(member({ canControl: true })), true);
  assertEquals(canControlRoom(member()), false);
});

// Sad path
Deno.test("assertCanControl throws for a plain viewer", () => {
  assertThrows(() => assertCanControl(member()), AppError, "permission");
});

// Mutation case: grantControl flips only the target, requires a grantor
Deno.test("grantControl flips the target flag and requires a grantor", () => {
  const actor = member({ role: "host" });
  const target = member();
  grantControl(actor, target);
  assertEquals(target.canControl, true);
  assertThrows(() => grantControl(member(), member()), AppError, "permission");
});

// Mutation case: grantControl cannot demote a host
Deno.test("grantControl leaves a host unchanged", () => {
  const actor = member({ role: "host" });
  const target = member({ role: "host" });
  grantControl(actor, target);
  assertEquals(target.role, "host");
  assertEquals(target.canControl, true);
});

// Sad path + logical limit
Deno.test("revokeControl is host-only and cannot revoke a host", () => {
  const host = member({ role: "host" });
  const target = member({ canControl: true });
  revokeControl(host, target);
  assertEquals(target.canControl, false);
  const otherHost = member({ id: "h2", role: "host" });
  revokeControl(host, otherHost);
  assertEquals(otherHost.canControl, true);
  assertThrows(() => revokeControl(member(), member()), AppError, "permission");
});

// Edge: repeated grant/revoke is idempotent
Deno.test("repeated grant then revoke returns to not-controlling", () => {
  const host = member({ role: "host" });
  const target = member();
  grantControl(host, target);
  grantControl(host, target);
  assertEquals(target.canControl, true);
  revokeControl(host, target);
  revokeControl(host, target);
  assertEquals(target.canControl, false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `deno test server/entities/member/permissions.test.ts --sloppy-imports`
Expected: FAIL — module `./permissions.ts` not found.

- [ ] **Step 3: Implement**

`server/entities/member/permissions.ts`:
```ts
import { AppError } from "../../../shared/contracts/app-error.ts";
import type { Member } from "../../../shared/contracts/member.ts";

export function isHost(member: Member): boolean {
  return member.role === "host";
}

export function canControlRoom(member: Member): boolean {
  return member.role === "host" || member.canControl;
}

export function assertCanControl(member: Member): void {
  if (!canControlRoom(member)) throw new AppError("ROOM_PERMISSION_DENIED");
}

export function grantControl(actor: Member, target: Member): void {
  assertCanControl(actor);
  if (isHost(target)) return;
  target.canControl = true;
}

export function revokeControl(actor: Member, target: Member): void {
  if (!isHost(actor)) throw new AppError("ROOM_PERMISSION_DENIED");
  if (isHost(target)) return;
  target.canControl = false;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `deno test server/entities/member/permissions.test.ts --sloppy-imports`
Expected: 7 passing.

- [ ] **Step 5: Commit**

```bash
git add server/entities/member/permissions.ts server/entities/member/permissions.test.ts
git commit -m "Feat: adds room control permissions model"
```

---

### Task 6: Structured logger + socket utils

**Files:**
- Create: `server/shared/logger/logger.ts` — `type LogLevel`, `interface Logger`, `createLogger` (one module owning logging).
- Test: `server/shared/logger/logger.test.ts`
- Create: `server/shared/socket-utils.ts` — `currentRoom` (single function).
- Test: `server/shared/socket-utils.test.ts`

**Interfaces:**
- Produces: `type LogLevel = "debug" | "info" | "warn" | "error"`; `interface Logger { debug/info/warn/error(msg, fields?) }`; `createLogger({ level, sink? }): Logger`. `currentRoom(socket: Socket): string | undefined`.

- [ ] **Step 1: Write the failing tests (all five categories)**

`server/shared/logger/logger.test.ts`:
```ts
import { assertEquals } from "@std/assert";
import { createLogger } from "./logger.ts";

// Logical limit: exactly-at-level included, below filtered
Deno.test("logger filters below the configured level", () => {
  const lines: string[] = [];
  const log = createLogger({ level: "warn", sink: (l) => lines.push(l) });
  log.debug("d");
  log.info("i");
  log.warn("w");
  log.error("e");
  assertEquals(lines.length, 2);
  assertEquals(lines[0].includes('"level":"warn"'), true);
  assertEquals(lines[1].includes('"level":"error"'), true);
});

// Happy path: debug level includes everything
Deno.test("logger at debug level emits all levels", () => {
  const lines: string[] = [];
  const log = createLogger({ level: "debug", sink: (l) => lines.push(l) });
  log.debug("d");
  log.error("e");
  assertEquals(lines.length, 2);
});

// Happy path + mutation: fields are merged into the JSON line
Deno.test("logger includes structured fields", () => {
  const lines: string[] = [];
  const log = createLogger({ level: "info", sink: (l) => lines.push(l) });
  log.info("joined", { code: "abcde" });
  const parsed = JSON.parse(lines[0]);
  assertEquals(parsed.msg, "joined");
  assertEquals(parsed.code, "abcde");
});
```

`server/shared/socket-utils.test.ts`:
```ts
import { assertEquals } from "@std/assert";
import { currentRoom } from "./socket-utils.ts";

function fakeSocket(id: string, rooms: string[]) {
  return { id, rooms: new Set(rooms) } as unknown as {
    id: string;
    rooms: Set<string>;
  };
}

// Happy path
Deno.test("currentRoom returns the first non-self room name", () => {
  assertEquals(currentRoom(fakeSocket("sock-1", ["sock-1", "abcde"])), "abcde");
});

// Edge: only self in rooms -> undefined
Deno.test("currentRoom returns undefined when in no room", () => {
  assertEquals(currentRoom(fakeSocket("sock-1", ["sock-1"])), undefined);
});

// Edge: empty rooms -> undefined
Deno.test("currentRoom returns undefined for an empty rooms set", () => {
  assertEquals(currentRoom(fakeSocket("sock-1", [])), undefined);
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `deno test server/shared/logger/logger.test.ts server/shared/socket-utils.test.ts --sloppy-imports`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement**

`server/shared/logger/logger.ts`:
```ts
export type LogLevel = "debug" | "info" | "warn" | "error";

export interface Logger {
  debug(msg: string, fields?: Record<string, unknown>): void;
  info(msg: string, fields?: Record<string, unknown>): void;
  warn(msg: string, fields?: Record<string, unknown>): void;
  error(msg: string, fields?: Record<string, unknown>): void;
}

export interface LoggerDeps {
  level: LogLevel;
  sink?: (line: string) => void;
}

const ORDER: LogLevel[] = ["debug", "info", "warn", "error"];

export function createLogger(deps: LoggerDeps): Logger {
  const threshold = ORDER.indexOf(deps.level);
  const write = deps.sink ?? ((line: string) => console.log(line));

  function log(level: LogLevel, msg: string, fields?: Record<string, unknown>): void {
    if (ORDER.indexOf(level) < threshold) return;
    write(JSON.stringify({ ts: new Date().toISOString(), level, msg, ...fields }));
  }

  return {
    debug: (m, f) => log("debug", m, f),
    info: (m, f) => log("info", m, f),
    warn: (m, f) => log("warn", m, f),
    error: (m, f) => log("error", m, f),
  };
}
```

`server/shared/socket-utils.ts`:
```ts
import type { Socket } from "socket.io";

export function currentRoom(socket: Socket): string | undefined {
  for (const name of socket.rooms) {
    if (name !== socket.id) return name;
  }
  return undefined;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `deno test server/shared/logger/logger.test.ts server/shared/socket-utils.test.ts --sloppy-imports`
Expected: 6 passing.

- [ ] **Step 5: Commit**

```bash
git add server/shared/logger/logger.ts server/shared/logger/logger.test.ts server/shared/socket-utils.ts server/shared/socket-utils.test.ts
git commit -m "Feat: adds structured logger and socket room helper"
```

---

### Task 7: Signaling feature

**Files:**
- Create: `server/features/signaling/signaling-handler.ts` — `class SignalingHandler` + `interface SignalingDeps` (one module).
- Test: `server/features/signaling/signaling-handler.test.ts`

**Interfaces:**
- Consumes: `SOCKET_EVENTS` (Task 1), `SignalPayload`/`RelaySignalPayload` (Task 1), `currentRoom` (Task 6), `Logger` (Task 6).
- Produces: `class SignalingHandler` with `constructor({ io, logger })` and `attach(): void`. On `SOCKET_EVENTS.SIGNAL`, relays `{ peerId, signalData }` to `payload.to` if present, otherwise to the socket's current room.

- [ ] **Step 1: Write the failing tests (all five categories)**

`server/features/signaling/signaling-handler.test.ts`:
```ts
import { assertEquals } from "@std/assert";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { io as ClientIO, type Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "../../../shared/contracts/socket-events.ts";
import { createLogger } from "../../shared/logger/logger.ts";
import { SignalingHandler } from "./signaling-handler.ts";

function silentLogger() {
  return createLogger({ level: "error", sink: () => {} });
}

async function makeHarness() {
  const httpServer: Server = createServer();
  const io = new SocketIOServer(httpServer, { cors: { origin: "*" } });
  new SignalingHandler({ io, logger: silentLogger() }).attach();
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const addr = httpServer.address() as { port: number };
  const url = `http://localhost:${addr.port}`;

  function connect(): Promise<Socket> {
    return new Promise((resolve) => {
      const client: Socket = ClientIO(url, { transports: ["websocket", "polling"] });
      client.on("connect", () => resolve(client));
    });
  }

  return { io, httpServer, connect };
}

// Happy path: targeted relay
Deno.test("signal relays to a targeted socket with sender peerId", async () => {
  const h = await makeHarness();
  try {
    const a = await h.connect();
    const b = await h.connect();
    const received = new Promise<{ peerId: string; signalData: unknown }>((resolve) => {
      b.on(SOCKET_EVENTS.SIGNAL, resolve);
    });
    a.emit(SOCKET_EVENTS.SIGNAL, { to: b.id, signalData: { sdp: "offer" } });
    const payload = await received;
    assertEquals(payload.peerId, a.id);
    assertEquals(payload.signalData, { sdp: "offer" });
    a.disconnect();
    b.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(r));
  }
});

// Sad path: signal to a nonexistent target is dropped silently (no crash)
Deno.test("signal to a nonexistent target does not throw", async () => {
  const h = await makeHarness();
  try {
    const a = await h.connect();
    a.emit(SOCKET_EVENTS.SIGNAL, { to: "nope", signalData: { sdp: "x" } });
    await new Promise((r) => setTimeout(r, 200));
    assertEquals(a.connected, true);
    a.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(r));
  }
});

// Edge: missing 'to' relays to the room (no targeted peer) — still no crash
Deno.test("signal without a target is tolerated", async () => {
  const h = await makeHarness();
  try {
    const a = await h.connect();
    a.emit(SOCKET_EVENTS.SIGNAL, { signalData: { sdp: "x" } });
    await new Promise((r) => setTimeout(r, 200));
    assertEquals(a.connected, true);
    a.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(r));
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `deno test server/features/signaling/signaling-handler.test.ts --sloppy-imports`
Expected: FAIL — module `./signaling-handler.ts` not found.

- [ ] **Step 3: Implement**

`server/features/signaling/signaling-handler.ts`:
```ts
import type { Server, Socket } from "socket.io";
import { SOCKET_EVENTS } from "../../../shared/contracts/socket-events.ts";
import type {
  RelaySignalPayload,
  SignalPayload,
} from "../../../shared/contracts/payloads/relay-signal-payload.ts";
import type { SignalPayload as SignalPayloadT } from "../../../shared/contracts/payloads/signal-payload.ts";
import type { Logger } from "../../shared/logger/logger.ts";
import { currentRoom } from "../../shared/socket-utils.ts";

export interface SignalingDeps {
  io: Server;
  logger: Logger;
}

export class SignalingHandler {
  constructor(private deps: SignalingDeps) {}

  attach(): void {
    this.deps.io.on("connection", (socket) => this.onConnection(socket));
  }

  private onConnection(socket: Socket): void {
    socket.emit(SOCKET_EVENTS.SOCKET_ID_META, { peerId: socket.id });
    socket.on(SOCKET_EVENTS.SIGNAL, (payload: SignalPayloadT) =>
      this.onSignal(socket, payload)
    );
  }

  private onSignal(socket: Socket, payload: SignalPayloadT): void {
    const relay: RelaySignalPayload = {
      peerId: socket.id,
      signalData: payload?.signalData,
    };
    if (payload?.to && typeof payload.to === "string") {
      this.deps.io.to(payload.to).emit(SOCKET_EVENTS.SIGNAL, relay);
      return;
    }
    const room = currentRoom(socket);
    if (room) {
      this.deps.io.to(room).emit(SOCKET_EVENTS.SIGNAL, relay);
    }
    this.deps.logger.debug("signal relayed", { from: socket.id, room });
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `deno test server/features/signaling/signaling-handler.test.ts --sloppy-imports`
Expected: 3 passing.

- [ ] **Step 5: Commit**

```bash
git add server/features/signaling/signaling-handler.ts server/features/signaling/signaling-handler.test.ts
git commit -m "Feat: adds socket.io signaling relay"
```

---

### Task 8: Room feature (create / join / lock / leave / host-disconnect)

**Files:**
- Create: `server/features/room/room-handler.ts` — `class RoomHandler` + `interface RoomHandlerDeps` (one module).
- Test: `server/features/room/room-handler.test.ts`

**Interfaces:**
- Consumes: `RoomStore` (Task 3), `SOCKET_EVENTS` + payload types (Task 1), `AppError` (Task 1), `Logger` (Task 6).
- Produces: `class RoomHandler` with `constructor({ io, rooms, logger })` and `attach()`. Handles `ROOM_CREATE`, `ROOM_JOIN`, `ROOM_LOCK`, `ROOM_UNLOCK`, `ROOM_LEAVE`, `disconnect`. Emits `ROOM_CREATED`, `ROOM_JOINED`, `MEMBER_JOINED`, `MEMBER_LEFT`, `ROOM_LOCKED`, `ROOM_UNLOCKED`, `ROOM_ENDED`, `APP_ERROR`.

- [ ] **Step 1: Write the failing tests (all five categories)**

`server/features/room/room-handler.test.ts`:
```ts
import { assertEquals } from "@std/assert";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { io as ClientIO, type Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "../../../shared/contracts/socket-events.ts";
import { RoomStore } from "../../entities/room-store/room-store.ts";
import { createLogger } from "../../shared/logger/logger.ts";
import { RoomHandler } from "./room-handler.ts";

function silentLogger() {
  return createLogger({ level: "error", sink: () => {} });
}

async function makeHarness() {
  const httpServer: Server = createServer();
  const io = new SocketIOServer(httpServer, { cors: { origin: "*" } });
  const rooms = new RoomStore({ maxMembers: 15, now: () => Date.now(), codeLength: 5 });
  new RoomHandler({ io, rooms, logger: silentLogger() }).attach();
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const addr = httpServer.address() as { port: number };
  const url = `http://localhost:${addr.port}`;

  function connect(): Promise<Socket> {
    return new Promise((resolve) => {
      const client: Socket = ClientIO(url, { transports: ["websocket", "polling"] });
      client.on("connect", () => resolve(client));
    });
  }

  function waitFor<T>(socket: Socket, event: string): Promise<T> {
    return new Promise((resolve) => socket.once(event, resolve));
  }

  return { io, httpServer, connect, waitFor, rooms };
}

// Happy path
Deno.test("host creates a room and receives a code", async () => {
  const h = await makeHarness();
  try {
    const host = await h.connect();
    const createdP = h.waitFor<{ room: { code: string; hostId: string } }>(host, SOCKET_EVENTS.ROOM_CREATED);
    host.emit(SOCKET_EVENTS.ROOM_CREATE, { name: "Alice" });
    const created = await createdP;
    assertEquals(typeof created.room.code, "string");
    assertEquals(created.room.hostId, host.id);
    host.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(r));
  }
});

// Sad path: empty host name -> typed error
Deno.test("creating a room with an empty name surfaces VALIDATION_NAME_EMPTY", async () => {
  const h = await makeHarness();
  try {
    const host = await h.connect();
    const errP = h.waitFor<{ code: string }>(host, SOCKET_EVENTS.APP_ERROR);
    host.emit(SOCKET_EVENTS.ROOM_CREATE, { name: "   " });
    const err = await errP;
    assertEquals(err.code, "VALIDATION_NAME_EMPTY");
    host.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(r));
  }
});

// Happy path
Deno.test("viewer joins a host's room and both see membership", async () => {
  const h = await makeHarness();
  try {
    const host = await h.connect();
    const createdP = h.waitFor<{ room: { code: string } }>(host, SOCKET_EVENTS.ROOM_CREATED);
    host.emit(SOCKET_EVENTS.ROOM_CREATE, { name: "Alice" });
    const { room } = await createdP;

    const joinedOnHost = h.waitFor<{ member: { name: string } }>(host, SOCKET_EVENTS.MEMBER_JOINED);
    const viewer = await h.connect();
    const joinedP = h.waitFor<{ room: { memberCount: number }; members: unknown[] }>(viewer, SOCKET_EVENTS.ROOM_JOINED);
    viewer.emit(SOCKET_EVENTS.ROOM_JOIN, { code: room.code, name: "Bob" });
    const joined = await joinedP;
    assertEquals(joined.room.memberCount, 2);
    const memberEvent = await joinedOnHost;
    assertEquals(memberEvent.member.name, "Bob");
    host.disconnect();
    viewer.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(r));
  }
});

// Sad path
Deno.test("joining a nonexistent room surfaces ROOM_NOT_FOUND", async () => {
  const h = await makeHarness();
  try {
    const viewer = await h.connect();
    const errP = h.waitFor<{ code: string }>(viewer, SOCKET_EVENTS.APP_ERROR);
    viewer.emit(SOCKET_EVENTS.ROOM_JOIN, { code: "zzzzz", name: "Bob" });
    const err = await errP;
    assertEquals(err.code, "ROOM_NOT_FOUND");
    viewer.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(r));
  }
});

// Logical limit: exactly-at-capacity joins, just-beyond surfaces ROOM_FULL
Deno.test("joining beyond capacity surfaces ROOM_FULL", async () => {
  const h = await makeHarness();
  try {
    // shrink capacity for this harness by recreating the room store at 2
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(r));
    const httpServer2: Server = createServer();
    const io2 = new SocketIOServer(httpServer2, { cors: { origin: "*" } });
    const rooms2 = new RoomStore({ maxMembers: 2, now: () => Date.now(), codeLength: 5 });
    new RoomHandler({ io: io2, rooms: rooms2, logger: silentLogger() }).attach();
    await new Promise<void>((resolve) => httpServer2.listen(0, resolve));
    const addr2 = httpServer2.address() as { port: number };
    const url2 = `http://localhost:${addr2.port}`;
    const connect2 = () => new Promise<Socket>((resolve) => {
      const c: Socket = ClientIO(url2, { transports: ["websocket", "polling"] });
      c.on("connect", () => resolve(c));
    });
    const waitFor2 = <T>(s: Socket, e: string) => new Promise<T>((resolve) => s.once(e, resolve));

    const host = await connect2();
    const createdP = waitFor2<{ room: { code: string } }>(host, SOCKET_EVENTS.ROOM_CREATED);
    host.emit(SOCKET_EVENTS.ROOM_CREATE, { name: "H" });
    const { room } = await createdP;
    const v1 = await connect2();
    const j1 = waitFor2<Record<string, unknown>>(v1, SOCKET_EVENTS.ROOM_JOINED);
    v1.emit(SOCKET_EVENTS.ROOM_JOIN, { code: room.code, name: "V1" });
    await j1;
    const v2 = await connect2();
    const errP = waitFor2<{ code: string }>(v2, SOCKET_EVENTS.APP_ERROR);
    v2.emit(SOCKET_EVENTS.ROOM_JOIN, { code: room.code, name: "V2" });
    const err = await errP;
    assertEquals(err.code, "ROOM_FULL");
    host.disconnect(); v1.disconnect(); v2.disconnect();
    io2.close();
    await new Promise<void>((r) => httpServer2.close(r));
    return;
  } finally {
    // outer harness already closed above when capacity test ran
  }
});

// Sad path + permission
Deno.test("a viewer cannot lock the room", async () => {
  const h = await makeHarness();
  try {
    const host = await h.connect();
    const createdP = h.waitFor<{ room: { code: string } }>(host, SOCKET_EVENTS.ROOM_CREATED);
    host.emit(SOCKET_EVENTS.ROOM_CREATE, { name: "Alice" });
    const { room } = await createdP;
    const viewer = await h.connect();
    const joinedP = h.waitFor<Record<string, unknown>>(viewer, SOCKET_EVENTS.ROOM_JOINED);
    viewer.emit(SOCKET_EVENTS.ROOM_JOIN, { code: room.code, name: "Bob" });
    await joinedP;
    const errP = h.waitFor<{ code: string }>(viewer, SOCKET_EVENTS.APP_ERROR);
    viewer.emit(SOCKET_EVENTS.ROOM_LOCK, {});
    const err = await errP;
    assertEquals(err.code, "ROOM_PERMISSION_DENIED");
    host.disconnect();
    viewer.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(r));
  }
});

// Happy path: host locks/unlocks and viewers are notified
Deno.test("host lock and unlock broadcast to the room", async () => {
  const h = await makeHarness();
  try {
    const host = await h.connect();
    const createdP = h.waitFor<{ room: { code: string } }>(host, SOCKET_EVENTS.ROOM_CREATED);
    host.emit(SOCKET_EVENTS.ROOM_CREATE, { name: "Alice" });
    const { room } = await createdP;
    const viewer = await h.connect();
    const joinedP = h.waitFor<Record<string, unknown>>(viewer, SOCKET_EVENTS.ROOM_JOINED);
    viewer.emit(SOCKET_EVENTS.ROOM_JOIN, { code: room.code, name: "Bob" });
    await joinedP;
    const lockedP = h.waitFor<Record<string, never>>(viewer, SOCKET_EVENTS.ROOM_LOCKED);
    host.emit(SOCKET_EVENTS.ROOM_LOCK, {});
    await lockedP;
    assertEquals(h.rooms.get(room.code)?.locked, true);
    host.disconnect();
    viewer.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(r));
  }
});

// Happy path + sad path: host disconnect ends the room; viewer leave broadcasts
Deno.test("host disconnect ends the room for viewers", async () => {
  const h = await makeHarness();
  try {
    const host = await h.connect();
    const createdP = h.waitFor<{ room: { code: string } }>(host, SOCKET_EVENTS.ROOM_CREATED);
    host.emit(SOCKET_EVENTS.ROOM_CREATE, { name: "Alice" });
    const { room } = await createdP;
    const viewer = await h.connect();
    const joinedP = h.waitFor<Record<string, unknown>>(viewer, SOCKET_EVENTS.ROOM_JOINED);
    viewer.emit(SOCKET_EVENTS.ROOM_JOIN, { code: room.code, name: "Bob" });
    await joinedP;
    const endedP = h.waitFor<Record<string, never>>(viewer, SOCKET_EVENTS.ROOM_ENDED);
    host.disconnect();
    await endedP;
    assertEquals(h.rooms.get(room.code), undefined);
    viewer.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(r));
  }
});

Deno.test("viewer leave broadcasts MEMBER_LEFT and keeps the room", async () => {
  const h = await makeHarness();
  try {
    const host = await h.connect();
    const createdP = h.waitFor<{ room: { code: string } }>(host, SOCKET_EVENTS.ROOM_CREATED);
    host.emit(SOCKET_EVENTS.ROOM_CREATE, { name: "Alice" });
    const { room } = await createdP;
    const viewer = await h.connect();
    const joinedP = h.waitFor<Record<string, unknown>>(viewer, SOCKET_EVENTS.ROOM_JOINED);
    viewer.emit(SOCKET_EVENTS.ROOM_JOIN, { code: room.code, name: "Bob" });
    await joinedP;
    const leftP = h.waitFor<{ memberId: string }>(host, SOCKET_EVENTS.MEMBER_LEFT);
    viewer.disconnect();
    const left = await leftP;
    assertEquals(left.memberId, viewer.id);
    assertEquals(h.rooms.get(room.code) !== undefined, true);
    host.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(r));
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `deno test server/features/room/room-handler.test.ts --sloppy-imports`
Expected: FAIL — module `./room-handler.ts` not found.

- [ ] **Step 3: Implement**

`server/features/room/room-handler.ts`:
```ts
import type { Server, Socket } from "socket.io";
import { SOCKET_EVENTS } from "../../../shared/contracts/socket-events.ts";
import { AppError } from "../../../shared/contracts/app-error.ts";
import type { Member } from "../../../shared/contracts/member.ts";
import type { MemberJoinedPayload } from "../../../shared/contracts/payloads/member-joined-payload.ts";
import type { MemberLeftPayload } from "../../../shared/contracts/payloads/member-left-payload.ts";
import type { RoomCreatePayload } from "../../../shared/contracts/payloads/room-create-payload.ts";
import type { RoomCreatedPayload } from "../../../shared/contracts/payloads/room-created-payload.ts";
import type { RoomJoinPayload } from "../../../shared/contracts/payloads/room-join-payload.ts";
import type { RoomJoinedPayload } from "../../../shared/contracts/payloads/room-joined-payload.ts";
import type { RoomStore } from "../../entities/room-store/room-store.ts";
import type { Logger } from "../../shared/logger/logger.ts";

export interface RoomHandlerDeps {
  io: Server;
  rooms: RoomStore;
  logger: Logger;
}

export class RoomHandler {
  constructor(private deps: RoomHandlerDeps) {}

  attach(): void {
    this.deps.io.on("connection", (socket) => this.onConnection(socket));
  }

  private onConnection(socket: Socket): void {
    socket.on(SOCKET_EVENTS.ROOM_CREATE, (p: RoomCreatePayload) => this.onCreate(socket, p));
    socket.on(SOCKET_EVENTS.ROOM_JOIN, (p: RoomJoinPayload) => this.onJoin(socket, p));
    socket.on(SOCKET_EVENTS.ROOM_LOCK, () => this.onLock(socket, true));
    socket.on(SOCKET_EVENTS.ROOM_UNLOCK, () => this.onLock(socket, false));
    socket.on(SOCKET_EVENTS.ROOM_LEAVE, () => this.onLeave(socket));
    socket.on("disconnect", () => this.onDisconnect(socket));
  }

  private onCreate(socket: Socket, payload: RoomCreatePayload): void {
    try {
      const room = this.deps.rooms.create(socket.id, payload?.name ?? "");
      void socket.join(room.code);
      const created: RoomCreatedPayload = { room: this.deps.rooms.toMeta(room) };
      socket.emit(SOCKET_EVENTS.ROOM_CREATED, created);
      this.deps.logger.info("room created", { code: room.code, host: socket.id });
    } catch (err) {
      this.emitError(socket, err);
    }
  }

  private onJoin(socket: Socket, payload: RoomJoinPayload): void {
    try {
      const code = payload?.code;
      const name = payload?.name ?? "";
      const room = this.deps.rooms.getOrThrow(code);
      const member: Member = {
        id: socket.id,
        name: name.trim(),
        role: "viewer",
        canControl: false,
        joinedAt: Date.now(),
      };
      this.deps.rooms.addMember(room, member);
      void socket.join(room.code);
      const joined: RoomJoinedPayload = {
        room: this.deps.rooms.toMeta(room),
        members: [...room.members.values()],
      };
      socket.emit(SOCKET_EVENTS.ROOM_JOINED, joined);
      const memberJoined: MemberJoinedPayload = { member };
      socket.to(room.code).emit(SOCKET_EVENTS.MEMBER_JOINED, memberJoined);
      this.deps.logger.info("member joined", { code: room.code, memberId: socket.id });
    } catch (err) {
      this.emitError(socket, err);
    }
  }

  private onLock(socket: Socket, locked: boolean): void {
    try {
      const room = this.findRoomFor(socket);
      if (!room) throw new AppError("ROOM_NOT_FOUND");
      if (room.hostId !== socket.id) throw new AppError("ROOM_PERMISSION_DENIED");
      room.locked = locked;
      this.deps.io
        .to(room.code)
        .emit(locked ? SOCKET_EVENTS.ROOM_LOCKED : SOCKET_EVENTS.ROOM_UNLOCKED, {});
    } catch (err) {
      this.emitError(socket, err);
    }
  }

  private onLeave(socket: Socket): void {
    this.removeMember(socket);
  }

  private onDisconnect(socket: Socket): void {
    this.removeMember(socket);
  }

  private removeMember(socket: Socket): void {
    const room = this.findRoomFor(socket);
    if (!room) return;
    if (room.hostId === socket.id) {
      this.deps.io.to(room.code).emit(SOCKET_EVENTS.ROOM_ENDED, {});
      this.deps.rooms.delete(room.code);
      this.deps.logger.info("room ended by host disconnect", { code: room.code });
      return;
    }
    const member = this.deps.rooms.removeMember(room, socket.id);
    if (!member) return;
    const memberLeft: MemberLeftPayload = { memberId: member.id };
    this.deps.io.to(room.code).emit(SOCKET_EVENTS.MEMBER_LEFT, memberLeft);
  }

  private findRoomFor(socket: Socket) {
    for (const name of socket.rooms) {
      const room = this.deps.rooms.get(name);
      if (room) return room;
    }
    return undefined;
  }

  private emitError(socket: Socket, err: unknown): void {
    if (err instanceof AppError) {
      socket.emit(SOCKET_EVENTS.APP_ERROR, err.toJSON());
      return;
    }
    this.deps.logger.error("room handler error", { error: String(err), socket: socket.id });
    socket.emit(SOCKET_EVENTS.APP_ERROR, new AppError("SERVER_INTERNAL").toJSON());
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `deno test server/features/room/room-handler.test.ts --sloppy-imports`
Expected: 9 passing.

- [ ] **Step 5: Commit**

```bash
git add server/features/room/room-handler.ts server/features/room/room-handler.test.ts
git commit -m "Feat: adds room create/join/lock/terminate handlers"
```

---

### Task 9: Chat feature (rate-limited relay)

**Files:**
- Create: `server/features/chat/chat-handler.ts` — `class ChatHandler` + `interface ChatHandlerDeps` (one module).
- Test: `server/features/chat/chat-handler.test.ts`

**Interfaces:**
- Consumes: `SOCKET_EVENTS` (Task 1), `ChatMessage`/`ChatSendPayload` (Task 1), `AppError` (Task 1), `currentRoom` (Task 6), `Logger` (Task 6).
- Produces: `class ChatHandler` with `constructor({ io, logger, maxMessageLength?, messagesPerWindow? })` and `attach()`. Handles `CHAT_SEND`, emits `CHAT_MESSAGE` to the room. Rate-limits per socket. Invalid length → `APP_ERROR` with `VALIDATION_CODE_MALFORMED`; rate-limit → `APP_ERROR` with `SERVER_RATE_LIMITED`.

- [ ] **Step 1: Write the failing tests (all five categories)**

`server/features/chat/chat-handler.test.ts`:
```ts
import { assertEquals } from "@std/assert";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { io as ClientIO, type Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "../../../shared/contracts/socket-events.ts";
import { RoomStore } from "../../entities/room-store/room-store.ts";
import { RoomHandler } from "../room/room-handler.ts";
import { createLogger } from "../../shared/logger/logger.ts";
import { ChatHandler } from "./chat-handler.ts";

function silentLogger() {
  return createLogger({ level: "error", sink: () => {} });
}

async function makeHarness(opts: { messagesPerWindow?: number; windowMs?: number; maxMessageLength?: number } = {}) {
  const httpServer: Server = createServer();
  const io = new SocketIOServer(httpServer, { cors: { origin: "*" } });
  const rooms = new RoomStore({ maxMembers: 15, now: () => Date.now(), codeLength: 5 });
  new RoomHandler({ io, rooms, logger: silentLogger() }).attach();
  new ChatHandler({
    io,
    logger: silentLogger(),
    maxMessageLength: opts.maxMessageLength ?? 500,
    messagesPerWindow: opts.messagesPerWindow ?? 5,
    windowMs: opts.windowMs ?? 2000,
  }).attach();
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const addr = httpServer.address() as { port: number };
  const url = `http://localhost:${addr.port}`;

  function connect(): Promise<Socket> {
    return new Promise((resolve) => {
      const client: Socket = ClientIO(url, { transports: ["websocket", "polling"] });
      client.on("connect", () => resolve(client));
    });
  }

  function waitFor<T>(socket: Socket, event: string): Promise<T> {
    return new Promise((resolve) => socket.once(event, resolve));
  }

  async function joinPair() {
    const host = await connect();
    const createdP = waitFor<{ room: { code: string } }>(host, SOCKET_EVENTS.ROOM_CREATED);
    host.emit(SOCKET_EVENTS.ROOM_CREATE, { name: "Alice" });
    const { room } = await createdP;
    const viewer = await connect();
    const joinedP = waitFor<Record<string, unknown>>(viewer, SOCKET_EVENTS.ROOM_JOINED);
    viewer.emit(SOCKET_EVENTS.ROOM_JOIN, { code: room.code, name: "Bob" });
    await joinedP;
    return { host, viewer, code: room.code };
  }

  return { io, httpServer, connect, waitFor, joinPair };
}

// Happy path
Deno.test("chat message is relayed to the room with sender metadata", async () => {
  const h = await makeHarness();
  try {
    const { host, viewer } = await h.joinPair();
    const msgOnHost = h.waitFor<{ text: string; senderName: string }>(host, SOCKET_EVENTS.CHAT_MESSAGE);
    viewer.emit(SOCKET_EVENTS.CHAT_SEND, { text: "hi everyone", senderName: "Bob" });
    const msg = await msgOnHost;
    assertEquals(msg.text, "hi everyone");
    assertEquals(msg.senderName, "Bob");
    host.disconnect(); viewer.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(r));
  }
});

// Sad path: empty message is ignored
Deno.test("empty chat message is ignored", async () => {
  const h = await makeHarness();
  try {
    const { host, viewer } = await h.joinPair();
    let emitted = false;
    host.on(SOCKET_EVENTS.CHAT_MESSAGE, () => { emitted = true; });
    viewer.emit(SOCKET_EVENTS.CHAT_SEND, { text: "   ", senderName: "Bob" });
    await new Promise((r) => setTimeout(r, 200));
    assertEquals(emitted, false);
    host.disconnect(); viewer.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(r));
  }
});

// Logical limit: exactly-at-max-length allowed, just-beyond rejected
Deno.test("oversized chat message is rejected with a typed error", async () => {
  const h = await makeHarness({ maxMessageLength: 10 });
  try {
    const { host, viewer } = await h.joinPair();
    const msgP = h.waitFor<{ text: string }>(host, SOCKET_EVENTS.CHAT_MESSAGE);
    viewer.emit(SOCKET_EVENTS.CHAT_SEND, { text: "1234567890", senderName: "Bob" }); // at limit
    const msg = await msgP;
    assertEquals(msg.text, "1234567890");

    const errP = h.waitFor<{ code: string }>(viewer, SOCKET_EVENTS.APP_ERROR);
    viewer.emit(SOCKET_EVENTS.CHAT_SEND, { text: "12345678901", senderName: "Bob" }); // beyond
    const err = await errP;
    assertEquals(err.code, "VALIDATION_CODE_MALFORMED");
    host.disconnect(); viewer.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(r));
  }
});

// Logical limit: exactly-at-rate allowed, just-beyond rate-limited
Deno.test("chat rate limiter allows the window budget and rejects beyond", async () => {
  const h = await makeHarness({ messagesPerWindow: 2, windowMs: 5000 });
  try {
    const { host, viewer } = await h.joinPair();
    const seen: string[] = [];
    host.on(SOCKET_EVENTS.CHAT_MESSAGE, (m: { text: string }) => seen.push(m.text));
    const errP = h.waitFor<{ code: string }>(viewer, SOCKET_EVENTS.APP_ERROR);

    viewer.emit(SOCKET_EVENTS.CHAT_SEND, { text: "one", senderName: "Bob" });
    viewer.emit(SOCKET_EVENTS.CHAT_SEND, { text: "two", senderName: "Bob" });
    await new Promise((r) => setTimeout(r, 150));
    assertEquals(seen.length, 2); // exactly at budget

    viewer.emit(SOCKET_EVENTS.CHAT_SEND, { text: "three", senderName: "Bob" }); // beyond
    const err = await errP;
    assertEquals(err.code, "SERVER_RATE_LIMITED");
    assertEquals(seen.length, 2);
    host.disconnect(); viewer.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(r));
  }
});

// Edge: a chat message sent before joining a room is dropped
Deno.test("chat before joining is dropped", async () => {
  const h = await makeHarness();
  try {
    const { host } = await h.joinPair();
    const stray = await h.connect();
    let emitted = false;
    host.on(SOCKET_EVENTS.CHAT_MESSAGE, () => { emitted = true; });
    stray.emit(SOCKET_EVENTS.CHAT_SEND, { text: "lonely", senderName: "L" });
    await new Promise((r) => setTimeout(r, 200));
    assertEquals(emitted, false);
    host.disconnect(); stray.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(r));
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `deno test server/features/chat/chat-handler.test.ts --sloppy-imports`
Expected: FAIL — module `./chat-handler.ts` not found.

- [ ] **Step 3: Implement**

`server/features/chat/chat-handler.ts`:
```ts
import type { Server, Socket } from "socket.io";
import { nanoid } from "nanoid";
import { SOCKET_EVENTS } from "../../../shared/contracts/socket-events.ts";
import { AppError } from "../../../shared/contracts/app-error.ts";
import type { ChatMessage } from "../../../shared/contracts/chat-message.ts";
import type { ChatSendPayload } from "../../../shared/contracts/payloads/chat-send-payload.ts";
import type { Logger } from "../../shared/logger/logger.ts";
import { currentRoom } from "../../shared/socket-utils.ts";

export interface ChatHandlerDeps {
  io: Server;
  logger: Logger;
  maxMessageLength?: number;
  messagesPerWindow?: number;
  windowMs?: number;
}

export class ChatHandler {
  private sendTimes = new Map<string, number[]>();
  private readonly maxMessageLength: number;
  private readonly messagesPerWindow: number;
  private readonly windowMs: number;
  private readonly io: Server;
  private readonly logger: Logger;

  constructor(deps: ChatHandlerDeps) {
    this.io = deps.io;
    this.logger = deps.logger;
    this.maxMessageLength = deps.maxMessageLength ?? 500;
    this.messagesPerWindow = deps.messagesPerWindow ?? 5;
    this.windowMs = deps.windowMs ?? 2000;
  }

  attach(): void {
    this.io.on("connection", (socket) => {
      socket.on(SOCKET_EVENTS.CHAT_SEND, (p: ChatSendPayload) =>
        this.onSend(socket, p)
      );
    });
  }

  private onSend(socket: Socket, payload: ChatSendPayload): void {
    const room = currentRoom(socket);
    if (!room) return;
    const text = typeof payload?.text === "string" ? payload.text : "";
    if (text.trim() === "" || text.length > this.maxMessageLength) {
      socket.emit(SOCKET_EVENTS.APP_ERROR, new AppError("VALIDATION_CODE_MALFORMED").toJSON());
      return;
    }
    if (!this.rateLimitOk(socket.id)) {
      socket.emit(SOCKET_EVENTS.APP_ERROR, new AppError("SERVER_RATE_LIMITED").toJSON());
      return;
    }
    const message: ChatMessage = {
      id: nanoid(),
      senderId: socket.id,
      senderName: payload.senderName ?? "",
      text,
      ts: Date.now(),
    };
    this.io.to(room).emit(SOCKET_EVENTS.CHAT_MESSAGE, message);
  }

  private rateLimitOk(socketId: string): boolean {
    const now = Date.now();
    const recent = (this.sendTimes.get(socketId) ?? []).filter(
      (t) => now - t < this.windowMs,
    );
    if (recent.length >= this.messagesPerWindow) {
      this.sendTimes.set(socketId, recent);
      return false;
    }
    recent.push(now);
    this.sendTimes.set(socketId, recent);
    return true;
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `deno test server/features/chat/chat-handler.test.ts --sloppy-imports`
Expected: 5 passing.

- [ ] **Step 5: Commit**

```bash
git add server/features/chat/chat-handler.ts server/features/chat/chat-handler.test.ts
git commit -m "Feat: adds rate-limited chat relay"
```

---

### Task 10: Reactions feature (relay)

**Files:**
- Create: `server/features/reactions/reaction-handler.ts` — `class ReactionHandler` + `interface ReactionHandlerDeps` (one module).
- Test: `server/features/reactions/reaction-handler.test.ts`

**Interfaces:**
- Consumes: `SOCKET_EVENTS` (Task 1), `Reaction`/`ReactionSendPayload` (Task 1), `currentRoom` (Task 6), `Logger` (Task 6).
- Produces: `class ReactionHandler` with `constructor({ io, logger })` and `attach()`. Handles `REACTION_SEND`, emits `REACTION` to the room. Emoji must be in the allowlist `["👍","😂","😮","❤️","🔥"]`; otherwise ignored.

- [ ] **Step 1: Write the failing tests (all five categories)**

`server/features/reactions/reaction-handler.test.ts`:
```ts
import { assertEquals } from "@std/assert";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { io as ClientIO, type Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "../../../shared/contracts/socket-events.ts";
import { RoomStore } from "../../entities/room-store/room-store.ts";
import { RoomHandler } from "../room/room-handler.ts";
import { createLogger } from "../../shared/logger/logger.ts";
import { ReactionHandler } from "./reaction-handler.ts";

function silentLogger() {
  return createLogger({ level: "error", sink: () => {} });
}

async function makeHarness() {
  const httpServer: Server = createServer();
  const io = new SocketIOServer(httpServer, { cors: { origin: "*" } });
  const rooms = new RoomStore({ maxMembers: 15, now: () => Date.now(), codeLength: 5 });
  new RoomHandler({ io, rooms, logger: silentLogger() }).attach();
  new ReactionHandler({ io, logger: silentLogger() }).attach();
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const addr = httpServer.address() as { port: number };
  const url = `http://localhost:${addr.port}`;

  function connect(): Promise<Socket> {
    return new Promise((resolve) => {
      const client: Socket = ClientIO(url, { transports: ["websocket", "polling"] });
      client.on("connect", () => resolve(client));
    });
  }

  function waitFor<T>(socket: Socket, event: string): Promise<T> {
    return new Promise((resolve) => socket.once(event, resolve));
  }

  async function joinPair() {
    const host = await connect();
    const createdP = waitFor<{ room: { code: string } }>(host, SOCKET_EVENTS.ROOM_CREATED);
    host.emit(SOCKET_EVENTS.ROOM_CREATE, { name: "Alice" });
    const { room } = await createdP;
    const viewer = await connect();
    const joinedP = waitFor<Record<string, unknown>>(viewer, SOCKET_EVENTS.ROOM_JOINED);
    viewer.emit(SOCKET_EVENTS.ROOM_JOIN, { code: room.code, name: "Bob" });
    await joinedP;
    return { host, viewer };
  }

  return { io, httpServer, connect, waitFor, joinPair };
}

// Happy path
Deno.test("reaction is relayed to the room", async () => {
  const h = await makeHarness();
  try {
    const { host, viewer } = await h.joinPair();
    const reactionP = h.waitFor<{ emoji: string; senderName: string }>(host, SOCKET_EVENTS.REACTION);
    viewer.emit(SOCKET_EVENTS.REACTION_SEND, { emoji: "🔥", senderName: "Bob" });
    const reaction = await reactionP;
    assertEquals(reaction.emoji, "🔥");
    assertEquals(reaction.senderName, "Bob");
    host.disconnect(); viewer.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(r));
  }
});

// Sad path: disallowed emoji is ignored
Deno.test("disallowed emoji is ignored", async () => {
  const h = await makeHarness();
  try {
    const { host, viewer } = await h.joinPair();
    let emitted = false;
    host.on(SOCKET_EVENTS.REACTION, () => { emitted = true; });
    viewer.emit(SOCKET_EVENTS.REACTION_SEND, { emoji: "🦄", senderName: "Bob" });
    await new Promise((r) => setTimeout(r, 200));
    assertEquals(emitted, false);
    host.disconnect(); viewer.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(r));
  }
});

// Edge: missing emoji is ignored
Deno.test("missing emoji is ignored", async () => {
  const h = await makeHarness();
  try {
    const { host, viewer } = await h.joinPair();
    let emitted = false;
    host.on(SOCKET_EVENTS.REACTION, () => { emitted = true; });
    viewer.emit(SOCKET_EVENTS.REACTION_SEND, { emoji: undefined, senderName: "Bob" });
    await new Promise((r) => setTimeout(r, 200));
    assertEquals(emitted, false);
    host.disconnect(); viewer.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(r));
  }
});

// Edge: reaction before joining is dropped
Deno.test("reaction before joining is dropped", async () => {
  const h = await makeHarness();
  try {
    const { host } = await h.joinPair();
    const stray = await h.connect();
    let emitted = false;
    host.on(SOCKET_EVENTS.REACTION, () => { emitted = true; });
    stray.emit(SOCKET_EVENTS.REACTION_SEND, { emoji: "🔥", senderName: "L" });
    await new Promise((r) => setTimeout(r, 200));
    assertEquals(emitted, false);
    host.disconnect(); stray.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(r));
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `deno test server/features/reactions/reaction-handler.test.ts --sloppy-imports`
Expected: FAIL — module `./reaction-handler.ts` not found.

- [ ] **Step 3: Implement**

`server/features/reactions/reaction-handler.ts`:
```ts
import type { Server, Socket } from "socket.io";
import { SOCKET_EVENTS } from "../../../shared/contracts/socket-events.ts";
import type { Reaction } from "../../../shared/contracts/reaction.ts";
import type { ReactionSendPayload } from "../../../shared/contracts/payloads/reaction-send-payload.ts";
import type { Logger } from "../../shared/logger/logger.ts";
import { currentRoom } from "../../shared/socket-utils.ts";

const ALLOWED_EMOJI = ["👍", "😂", "😮", "❤️", "🔥"];

export interface ReactionHandlerDeps {
  io: Server;
  logger: Logger;
}

export class ReactionHandler {
  constructor(private deps: ReactionHandlerDeps) {}

  attach(): void {
    this.deps.io.on("connection", (socket) => {
      socket.on(SOCKET_EVENTS.REACTION_SEND, (p: ReactionSendPayload) =>
        this.onSend(socket, p)
      );
    });
  }

  private onSend(socket: Socket, payload: ReactionSendPayload): void {
    const room = currentRoom(socket);
    if (!room) return;
    const emoji = payload?.emoji;
    if (!ALLOWED_EMOJI.includes(emoji)) return;
    const reaction: Reaction = {
      senderId: socket.id,
      senderName: payload.senderName ?? "",
      emoji,
      ts: Date.now(),
    };
    this.deps.io.to(room).emit(SOCKET_EVENTS.REACTION, reaction);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `deno test server/features/reactions/reaction-handler.test.ts --sloppy-imports`
Expected: 4 passing.

- [ ] **Step 5: Commit**

```bash
git add server/features/reactions/reaction-handler.ts server/features/reactions/reaction-handler.test.ts
git commit -m "Feat: adds emoji reaction relay with allowlist"
```

---

### Task 11: Server bootstrap (config + app entry)

**Files:**
- Create: `server/app/config.ts` — `type NodeEnv`, `interface AppConfig`, `function loadConfig` (one module).
- Test: `server/app/config.test.ts`
- Create: `server/app/server.ts` — `startServer` (single responsibility).
- Create: `server/app/entry.ts` — entrypoint.
- Modify: `deno.json` (add `tasks.dev`, `tasks.start`, imports alias `contracts/`).

**Interfaces:**
- Consumes: all features (Tasks 7-10), `RoomStore` (Task 3), `Logger` (Task 6), Express + React Router handler.
- Produces: `loadConfig(env): AppConfig` and `startServer(config, logger): Promise<http.Server>`. The server is plain HTTP (no TLS), serves `/healthz`, mounts Socket.IO with all handlers, and serves the React Router app (Vite middleware in dev, static build in production).

- [ ] **Step 1: Write the failing tests (all five categories)**

`server/app/config.test.ts`:
```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `deno test server/app/config.test.ts --sloppy-imports`
Expected: FAIL — module `./config.ts` not found.

- [ ] **Step 3: Implement config**

`server/app/config.ts`:
```ts
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
```

- [ ] **Step 4: Run config test to verify it passes**

Run: `deno test server/app/config.test.ts --sloppy-imports`
Expected: 4 passing.

- [ ] **Step 5: Implement the server entry**

`server/app/server.ts`:
```ts
import http from "node:http";
import path from "node:path";
import express from "express";
import { createRequestHandler } from "@react-router/express";
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
        build: () => vite.ssrLoadModule("virtual:react-router/server-build"),
        mode: "development",
      }),
    );
  } else {
    app.use(express.static(config.clientBuildPath));
    app.use(
      createRequestHandler({
        build: await import(config.serverBuildPath),
        assetsBuildDirectory: path.resolve(config.clientBuildPath),
      }),
    );
  }

  await new Promise<void>((resolve) => server.listen(config.port, resolve));
  logger.info("server listening", { port: config.port, env: config.nodeEnv });
  return server;
}
```

- [ ] **Step 6: Wire the entrypoint and tasks in `deno.json`**

Add the import alias and tasks to `deno.json`:
```json
"imports": {
  "contracts/": "./shared/contracts/"
},
"tasks": {
  "dev": "deno run -A server/app/entry.ts",
  "start": "NODE_ENV=production deno run -A server/app/entry.ts"
}
```

Create `server/app/entry.ts`:
```ts
import { loadConfig } from "./config.ts";
import { createLogger } from "../shared/logger/logger.ts";
import { startServer } from "./server.ts";

const config = loadConfig();
const logger = createLogger({ level: config.nodeEnv === "production" ? "info" : "debug" });
await startServer(config, logger);
```

- [ ] **Step 7: Verify the server boots and healthz responds**

Run: `deno task dev` (in one terminal), then:
```bash
curl -s http://localhost:5173/healthz
```
Expected: `{"ok":true}`

- [ ] **Step 8: Commit**

```bash
git add server/app/config.ts server/app/config.test.ts server/app/server.ts server/app/entry.ts deno.json
git commit -m "Feat: adds server bootstrap with config, healthz, and feature wiring"
```

---

### Task 12: Client typed socket API (minimal wiring)

**Files:**
- Create: `app/shared/api/socket-client.ts` — `interface SocketClientDeps` + `interface SocketClient` + `createSocketClient` (one module).
- Test: `app/shared/api/socket-client.test.ts`
- Create: `app/shared/api/sync-engine-client.ts` — `interface SyncEngineClientDeps` + `interface SyncEngineClient` + `createSyncEngineClient` (one module).
- Test: `app/shared/api/sync-engine-client.test.ts`

**Interfaces:**
- Consumes: `SOCKET_EVENTS`, `AppError`, entity + payload types via `contracts/` alias (Task 1).
- Produces:
  - `createSocketClient({ url }): SocketClient` where `SocketClient` has `createRoom(name): Promise<RoomMeta>`, `joinRoom(code, name): Promise<RoomJoinedPayload>`, `sendChat(text)`, `sendReaction(emoji)`, `grantControl(targetId)`, `revokeControl(targetId)`, `sendSignal(to, signalData)`, `onMemberJoined(cb)`, `onMemberLeft(cb)`, `onChatMessage(cb)`, `onReaction(cb)`, `onSignal(cb)`, `onRoomEnded(cb)`, `getSocketId(): string | undefined`, `disconnect()`. Emits/throws `AppError` on `APP_ERROR`.
  - `createSyncEngineClient({ driftThresholdMs }): SyncEngineClient` with `applySnapshot(snapshot)`, `getSnapshot()`, `projectAt(now)`, `driftStatus(viewerPositionMs, now)`.

- [ ] **Step 1: Write the failing tests (all five categories)**

`app/shared/api/sync-engine-client.test.ts` (pure — no sockets):
```ts
import { assertEquals } from "@std/assert";
import { createSyncEngineClient } from "./sync-engine-client.ts";

// Happy path
Deno.test("applies a snapshot as the current sync state", () => {
  const engine = createSyncEngineClient({ driftThresholdMs: 1500 });
  engine.applySnapshot({ status: "paused", currentTime: 30, duration: 120, rate: 1, updatedAt: 100_000 });
  const snap = engine.getSnapshot();
  assertEquals(snap?.status, "paused");
  assertEquals(snap?.currentTime, 30);
});

// Happy path
Deno.test("projects playing state forward from the snapshot timestamp", () => {
  const engine = createSyncEngineClient({ driftThresholdMs: 1500 });
  engine.applySnapshot({ status: "playing", currentTime: 30, duration: 120, rate: 1, updatedAt: 100_000 });
  const projected = engine.projectAt(102_000);
  assertEquals(projected?.currentTime, 32);
});

// Edge: no snapshot yet -> undefined
Deno.test("projectAt and getSnapshot are undefined before any snapshot", () => {
  const engine = createSyncEngineClient({ driftThresholdMs: 1500 });
  assertEquals(engine.getSnapshot(), undefined);
  assertEquals(engine.projectAt(100_000), undefined);
});

// Logical limit: drift status exactly-at-threshold is in-sync, beyond is not
Deno.test("reports drift status against the exact threshold", () => {
  const engine = createSyncEngineClient({ driftThresholdMs: 1500 });
  engine.applySnapshot({ status: "playing", currentTime: 30, duration: 120, rate: 1, updatedAt: 100_000 });
  assertEquals(engine.driftStatus(30_000, 100_000), "in-sync");
  assertEquals(engine.driftStatus(31_500, 100_000), "in-sync");
  assertEquals(engine.driftStatus(31_501, 100_000), "ahead");
  assertEquals(engine.driftStatus(28_499, 100_000), "behind");
});

// Mutation case: applying a new snapshot replaces the previous one
Deno.test("applySnapshot replaces the previous snapshot", () => {
  const engine = createSyncEngineClient({ driftThresholdMs: 1500 });
  engine.applySnapshot({ status: "playing", currentTime: 10, duration: 120, rate: 1, updatedAt: 100_000 });
  engine.applySnapshot({ status: "paused", currentTime: 40, duration: 120, rate: 1, updatedAt: 101_000 });
  assertEquals(engine.getSnapshot()?.currentTime, 40);
  assertEquals(engine.getSnapshot()?.status, "paused");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `deno test app/shared/api/sync-engine-client.test.ts --sloppy-imports`
Expected: FAIL — module `./sync-engine-client.ts` not found.

- [ ] **Step 3: Implement the client sync engine**

`app/shared/api/sync-engine-client.ts`:
```ts
import type { PlaybackSnapshot } from "contracts/playback.ts";

export interface SyncEngineClientDeps {
  driftThresholdMs: number;
}

export interface SyncEngineClient {
  applySnapshot(snapshot: PlaybackSnapshot): void;
  getSnapshot(): PlaybackSnapshot | undefined;
  projectAt(now: number): PlaybackSnapshot | undefined;
  driftStatus(viewerPositionMs: number, now: number): "in-sync" | "behind" | "ahead";
}

export function createSyncEngineClient(deps: SyncEngineClientDeps): SyncEngineClient {
  let snapshot: PlaybackSnapshot | undefined;

  function projectAt(now: number): PlaybackSnapshot | undefined {
    if (!snapshot) return undefined;
    if (snapshot.status !== "playing") return snapshot;
    const elapsed = Math.max(0, (now - snapshot.updatedAt) / 1000) * snapshot.rate;
    const duration = snapshot.duration || Number.POSITIVE_INFINITY;
    return { ...snapshot, currentTime: Math.min(snapshot.currentTime + elapsed, duration) };
  }

  function driftStatus(viewerPositionMs: number, now: number): "in-sync" | "behind" | "ahead" {
    const authoritative = projectAt(now);
    if (!authoritative) return "in-sync";
    const diff = viewerPositionMs - authoritative.currentTime * 1000;
    if (Math.abs(diff) <= deps.driftThresholdMs) return "in-sync";
    return diff < 0 ? "behind" : "ahead";
  }

  return {
    applySnapshot(s) { snapshot = s; },
    getSnapshot: () => snapshot,
    projectAt,
    driftStatus,
  };
}
```

- [ ] **Step 4: Run sync engine test to verify it passes**

Run: `deno test app/shared/api/sync-engine-client.test.ts --sloppy-imports`
Expected: 5 passing.

- [ ] **Step 5: Write the failing socket-client test**

`app/shared/api/socket-client.test.ts`:
```ts
import { assertEquals } from "@std/assert";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { createSocketClient } from "./socket-client.ts";
import { RoomHandler } from "../../../server/features/room/room-handler.ts";
import { RoomStore } from "../../../server/entities/room-store/room-store.ts";
import { createLogger } from "../../../server/shared/logger/logger.ts";

function silentLogger() {
  return createLogger({ level: "error", sink: () => {} });
}

// Happy path
Deno.test("createSocketClient creates a room and returns its code", async () => {
  const httpServer: Server = createServer();
  const io = new SocketIOServer(httpServer, { cors: { origin: "*" } });
  const rooms = new RoomStore({ maxMembers: 15, now: () => Date.now(), codeLength: 5 });
  new RoomHandler({ io, rooms, logger: silentLogger() }).attach();
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const addr = httpServer.address() as { port: number };
  const url = `http://localhost:${addr.port}`;

  try {
    const client = createSocketClient({ url });
    const room = await client.createRoom("Alice");
    assertEquals(typeof room.code, "string");
    client.disconnect();
  } finally {
    io.close();
    await new Promise<void>((r) => httpServer.close(r));
  }
});

// Sad path: createRoom with an empty name surfaces a typed AppError
Deno.test("createSocketClient surfaces AppError for an empty name", async () => {
  const httpServer: Server = createServer();
  const io = new SocketIOServer(httpServer, { cors: { origin: "*" } });
  const rooms = new RoomStore({ maxMembers: 15, now: () => Date.now(), codeLength: 5 });
  new RoomHandler({ io, rooms, logger: silentLogger() }).attach();
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  const addr = httpServer.address() as { port: number };
  const url = `http://localhost:${addr.port}`;

  try {
    const client = createSocketClient({ url });
    let caught: { code: string } | undefined;
    try {
      await client.createRoom("   ");
    } catch (err) {
      caught = err as { code: string };
    }
    assertEquals(caught?.code, "VALIDATION_NAME_EMPTY");
    client.disconnect();
  } finally {
    io.close();
    await new Promise<void>((r) => httpServer.close(r));
  }
});
```

- [ ] **Step 6: Run socket-client test to verify it fails**

Run: `deno test app/shared/api/socket-client.test.ts --sloppy-imports`
Expected: FAIL — module `./socket-client.ts` not found.

- [ ] **Step 7: Implement the socket client**

`app/shared/api/socket-client.ts`:
```ts
import { io, type Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "contracts/socket-events.ts";
import { AppError } from "contracts/app-error.ts";
import type { ChatMessage } from "contracts/chat-message.ts";
import type { MemberJoinedPayload } from "contracts/payloads/member-joined-payload.ts";
import type { MemberLeftPayload } from "contracts/payloads/member-left-payload.ts";
import type { Reaction } from "contracts/reaction.ts";
import type { RelaySignalPayload } from "contracts/payloads/relay-signal-payload.ts";
import type { RoomCreatePayload } from "contracts/payloads/room-create-payload.ts";
import type { RoomCreatedPayload } from "contracts/payloads/room-created-payload.ts";
import type { RoomJoinPayload } from "contracts/payloads/room-join-payload.ts";
import type { RoomJoinedPayload } from "contracts/payloads/room-joined-payload.ts";
import type { RoomMeta } from "contracts/room-meta.ts";
import type { SignalPayload } from "contracts/payloads/signal-payload.ts";
import type { ControlGrantPayload } from "contracts/payloads/control-grant-payload.ts";
import type { ControlRevokePayload } from "contracts/payloads/control-revoke-payload.ts";

export interface SocketClientDeps {
  url: string;
}

export interface SocketClient {
  createRoom(name: string): Promise<RoomMeta>;
  joinRoom(code: string, name: string): Promise<RoomJoinedPayload>;
  sendChat(text: string): void;
  sendReaction(emoji: string): void;
  grantControl(targetId: string): void;
  revokeControl(targetId: string): void;
  sendSignal(to: string, signalData: unknown): void;
  onMemberJoined(cb: (p: MemberJoinedPayload) => void): void;
  onMemberLeft(cb: (p: MemberLeftPayload) => void): void;
  onChatMessage(cb: (m: ChatMessage) => void): void;
  onReaction(cb: (r: Reaction) => void): void;
  onSignal(cb: (p: RelaySignalPayload) => void): void;
  onRoomEnded(cb: () => void): void;
  getSocketId(): string | undefined;
  disconnect(): void;
}

export function createSocketClient(deps: SocketClientDeps): SocketClient {
  const socket: Socket = io(deps.url, {
    path: "/socket.io",
    transports: ["websocket", "polling"],
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  const pending = new Map<string, (payload: unknown) => void>();
  socket.on(SOCKET_EVENTS.ROOM_CREATED, (p: unknown) => {
    pending.get("create")?.(p);
    pending.delete("create");
  });
  socket.on(SOCKET_EVENTS.ROOM_JOINED, (p: unknown) => {
    pending.get("join")?.(p);
    pending.delete("join");
  });
  socket.on(SOCKET_EVENTS.APP_ERROR, (err: { code: string }) => {
    const reject = pending.get("error");
    pending.clear();
    reject?.(new AppError(err.code as never));
  });

  function request<T>(key: string, payload: unknown): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      pending.set("error", reject);
      pending.set(key, (p: unknown) => resolve(p as T));
      socket.emit(key === "create" ? SOCKET_EVENTS.ROOM_CREATE : SOCKET_EVENTS.ROOM_JOIN, payload);
    });
  }

  return {
    createRoom(name) {
      const payload: RoomCreatePayload = { name };
      return request<RoomCreatedPayload>("create", payload).then((p) => p.room);
    },
    joinRoom(code, name) {
      const payload: RoomJoinPayload = { code, name };
      return request<RoomJoinedPayload>("join", payload);
    },
    sendChat(text) {
      socket.emit(SOCKET_EVENTS.CHAT_SEND, { text, senderName: "" });
    },
    sendReaction(emoji) {
      socket.emit(SOCKET_EVENTS.REACTION_SEND, { emoji, senderName: "" });
    },
    grantControl(targetId) {
      const payload: ControlGrantPayload = { targetId };
      socket.emit(SOCKET_EVENTS.CONTROL_GRANT, payload);
    },
    revokeControl(targetId) {
      const payload: ControlRevokePayload = { targetId };
      socket.emit(SOCKET_EVENTS.CONTROL_REVOKE, payload);
    },
    sendSignal(to, signalData) {
      const payload: SignalPayload = { to, signalData };
      socket.emit(SOCKET_EVENTS.SIGNAL, payload);
    },
    onMemberJoined(cb) { socket.on(SOCKET_EVENTS.MEMBER_JOINED, cb); },
    onMemberLeft(cb) { socket.on(SOCKET_EVENTS.MEMBER_LEFT, cb); },
    onChatMessage(cb) { socket.on(SOCKET_EVENTS.CHAT_MESSAGE, cb); },
    onReaction(cb) { socket.on(SOCKET_EVENTS.REACTION, cb); },
    onSignal(cb) { socket.on(SOCKET_EVENTS.SIGNAL, cb); },
    onRoomEnded(cb) { socket.on(SOCKET_EVENTS.ROOM_ENDED, cb); },
    getSocketId: () => socket.id,
    disconnect: () => socket.disconnect(),
  };
}
```

- [ ] **Step 8: Run socket-client test to verify it passes**

Run: `deno test app/shared/api/socket-client.test.ts --sloppy-imports`
Expected: 2 passing.

- [ ] **Step 9: Add the `contracts/` alias and run full verify**

Ensure `deno.json` `imports` includes `"contracts/": "./shared/contracts/"`. Then run:
```bash
deno task verify
```
Expected: all fmt/lint/check/test pass.

- [ ] **Step 10: Commit**

```bash
git add app/shared/api/socket-client.ts app/shared/api/socket-client.test.ts app/shared/api/sync-engine-client.ts app/shared/api/sync-engine-client.test.ts deno.json
git commit -m "Feat: adds typed client socket API and client sync engine"
```

---

## Self-Review

- **Spec coverage:** F1–F4 (room lifecycle) → Tasks 3 + 8. F24 (signaling) → Task 7. F19/F20 (chat) → Task 9. F22 (reactions) → Task 10. F10–F12 (sync engine + drift) → Tasks 4 + 12. F15/F18 (grant/revoke) → Task 5 (permissions) + socket-client methods in Task 12. F27/F28 (healthz, TLS-proxy HTTP) → Task 11. Error model + guardrails → Task 1 + every handler's `emitError`.
- **Placeholder scan:** no TBD/TODO; every step has code and commands.
- **Type consistency:** `PlaybackSnapshot`, `Member`, `RoomMeta`, `AppError`, `SOCKET_EVENTS`, `RoomStore`, `PlaybackState` names match across tasks. `contracts/` alias resolves for the client; relative `../shared/contracts` paths for the server. Payload types are imported from `shared/contracts/payloads/*` consistently in Tasks 7-10 and 12.
- **Test-depth audit (all five categories):**
  - Task 1: happy ✓ sad ✓ edge ✓ mutation ✓ (no numeric limit — N/A for error model).
  - Task 2: happy ✓ sad ✓ edge ✓ mutation ✓ limits ✓ (length at/beyond).
  - Task 3: happy ✓ sad ✓ edge ✓ mutation ✓ limits ✓ (capacity 15/16, lock).
  - Task 4: happy ✓ sad ✓ edge ✓ mutation ✓ limits ✓ (clamp 0/duration, drift 1500/1501).
  - Task 5: happy ✓ sad ✓ edge ✓ mutation ✓ limits ✓ (idempotent grant/revoke).
  - Task 6: happy ✓ edge ✓ limits ✓ (level filter at/below; rooms set edge).
  - Task 7: happy ✓ sad ✓ edge ✓ (targeted, missing target, nonexistent target).
  - Task 8: happy ✓ sad ✓ edge ✓ mutation ✓ limits ✓ (capacity 2/3, lock, host-disconnect, viewer-leave).
  - Task 9: happy ✓ sad ✓ edge ✓ limits ✓ (max-length 10/11, rate 2/3).
  - Task 10: happy ✓ sad ✓ edge ✓ (allowlist, missing emoji, pre-join).
  - Task 11: happy ✓ sad ✓ mutation ✓ limits ✓ (invalid port fallback).
  - Task 12: happy ✓ sad ✓ edge ✓ mutation ✓ limits ✓ (drift threshold, no-snapshot).
- **File-segregation audit:** each entity/type/class/function in Task 1 has its own file; `room.ts`, `room-store.ts`, `playback-state.ts`, `permissions.ts`, handlers, config, and client modules are each a single unit. No `types.ts`/`utils.ts`/`events.ts` grab-bags anywhere.

**Phase 2 (UI)** will be a separate plan: FSD restructure of `app/`, Zustand wiring, and the Apple HIG design system via `impeccable`.
