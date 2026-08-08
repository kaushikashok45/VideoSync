# Sync Party v2 — Backend (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild The Sync Party's realtime backend (room lifecycle, signaling, sync engine, chat, reactions, permissions) in a Feature-Sliced `server/` package with a shared typed error model, tested under Deno.

**Architecture:** Feature-Sliced Design. A root `shared/contracts/` layer holds the realtime protocol (error model, socket events, payload types) imported by both `app/` (client) and `server/`. The server is `server/app` (bootstrap) + `server/features` (room, chat, reactions, signaling) + `server/entities` (room-store, playback, member/permissions) + `server/shared` (logger, socket utils). Playback sync is a pure, testable `PlaybackState` engine; socket handlers are thin adapters that translate between typed contracts and socket.io.

**Tech Stack:** Deno 2.x, Socket.IO 4.x, Express 4, React Router v7 (request handler), `simple-peer` (client, unchanged), Deno built-in test runner, `@std/assert`.

## Global Constraints

- **TDD is mandatory** — write the failing test first, then minimal code, then refactor. `deno task verify` (fmt + lint + check + test) must pass at the end of every task.
- **FSD layer rules** — dependencies point inward only: `shared ← entities ← features ← app`. No cross-imports between features. No business logic in components; no JSX in model/api.
- **Tell, Don't Ask** — objects expose commands (`room.play()`) not state + inspect. Playback and room entities encapsulate their own decisions.
- **No floating helpers** — every function lives in the slice that owns it. Shared pure utilities go in `shared/` and are typed + tested. No `utils.ts` dumping grounds.
- **Error model** — every failure is a typed `AppError` with a stable `code`, human-readable `message`, and a `recovery` action when recoverable. No raw strings, no swallowed errors.
- **Contracts** — all socket event names and data-channel message types are string constants in `shared/contracts`, never inline. Changing a contract updates both sides.
- **Naming** — `handleX` handlers, `useXBehaviour` hooks, `*Manager`/`*Handler` classes, `Base*` abstract. Use `Receiver` (not `Reciever`).
- **No `any`** — use `unknown` + narrowing or precise types.
- **Transport decisions (from PRD)** — sync over P2P data channel (client); chat/reactions/room events over Socket.IO. Server runs **plain HTTP** (localhost is a secure context in browsers; production sits behind a platform TLS proxy).
- `deno.json` already has: `@std/assert`, `socket.io`, `socket.io-client`, `express`, `@react-router/express`, `react-router` imports. Node built-ins use `node:` prefix.

---

### Task 1: Shared error model (`AppError` + codes)

**Files:**
- Create: `shared/contracts/error.ts`
- Test: `shared/contracts/error.test.ts`
- Create: `shared/contracts/events.ts`
- Create: `shared/contracts/types.ts`

**Interfaces:**
- Produces: `class AppError extends Error` with `code`, `message`, `recovery?`, `detail?`, `toJSON(): AppErrorPayload`; `type ErrorCode` union; `type RecoveryAction`; `type Recovery`; `type AppErrorPayload`. All `shared/contracts/*` are imported via relative path (`../contracts/error`) by `server/` and via `contracts/error` alias by `app/`.

- [ ] **Step 1: Write the failing test**

`shared/contracts/error.test.ts`:
```ts
import { assertEquals } from "@std/assert";
import { AppError, errorMessageFor } from "./error.ts";

Deno.test("AppError carries a stable code and a human message", () => {
  const err = new AppError("ROOM_NOT_FOUND");
  assertEquals(err.code, "ROOM_NOT_FOUND");
  assertEquals(typeof err.message, "string");
  assertEquals(err.message.length > 0, true);
});

Deno.test("AppError serializes to a plain payload without a stack", () => {
  const err = new AppError("ROOM_PERMISSION_DENIED", { detail: { actorId: "x" } });
  const json = err.toJSON();
  assertEquals(json.code, "ROOM_PERMISSION_DENIED");
  assertEquals(json.detail, { actorId: "x" });
  assertEquals("stack" in json, false);
});

Deno.test("recoverable errors expose a recovery action", () => {
  const err = new AppError("TRANSPORT_PEER_FAILED");
  assertEquals(err.recovery?.action.kind, "retry");
  assertEquals(typeof err.recovery.label, "string");
});

Deno.test("every declared code has a non-empty human message", () => {
  const codes = [
    "VALIDATION_NAME_EMPTY", "VALIDATION_CODE_MALFORMED", "VALIDATION_URL_UNSUPPORTED",
    "ROOM_NOT_FOUND", "ROOM_FULL", "ROOM_LOCKED", "ROOM_ENDED", "ROOM_PERMISSION_DENIED",
    "MEDIA_UPLOAD_FAILED", "MEDIA_CAPTURE_FAILED", "MEDIA_UNSUPPORTED_CODEC", "MEDIA_URL_UNPLAYABLE",
    "SYNC_DRIFT_OUT_OF_BOUNDS", "SYNC_MEDIA_NOT_READY",
    "TRANSPORT_DISCONNECTED", "TRANSPORT_RECONNECT_FAILED", "TRANSPORT_PEER_FAILED",
    "SERVER_INTERNAL", "SERVER_RATE_LIMITED", "SERVER_ROOM_CAPACITY",
  ] as const;
  for (const code of codes) {
    assertEquals(errorMessageFor(code).length > 0, true, `missing message for ${code}`);
  }
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `deno test shared/contracts/error.test.ts --sloppy-imports`
Expected: FAIL — module `./error.ts` not found.

- [ ] **Step 3: Implement the error model**

`shared/contracts/error.ts`:
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

export interface AppErrorPayload {
  code: ErrorCode;
  message: string;
  recovery?: Recovery;
  detail?: Record<string, unknown>;
}

const ERROR_DEFS: Record<ErrorCode, { message: string; recovery?: Recovery }> = {
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

`shared/contracts/events.ts`:
```ts
export const SOCKET_EVENTS = {
  // client -> server
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

  // server -> client
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

export const DATA_CHANNEL_MESSAGES = {
  SYNC_STATE: "sync:state",
  SYNC_COMMAND: "sync:command",
  SYNC_DRIFT: "sync:drift",
  MEDIA_READY: "media:ready",
} as const;

export type SocketEvent = (typeof SOCKET_EVENTS)[keyof typeof SOCKET_EVENTS];
export type DataChannelMessage = (typeof DATA_CHANNEL_MESSAGES)[keyof typeof DATA_CHANNEL_MESSAGES];
```

`shared/contracts/types.ts`:
```ts
export type MemberRole = "host" | "viewer";

export interface Member {
  id: string;
  name: string;
  role: MemberRole;
  canControl: boolean;
  joinedAt: number;
}

export type MediaSource = { mode: "upload" } | { mode: "url"; url: string };

export type PlaybackStatus = "playing" | "paused" | "ended";

export interface PlaybackSnapshot {
  status: PlaybackStatus;
  currentTime: number;
  duration: number;
  rate: number;
  updatedAt: number;
}

export interface RoomMeta {
  code: string;
  locked: boolean;
  hostId: string;
  memberCount: number;
  maxMembers: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  ts: number;
}

export interface Reaction {
  senderId: string;
  senderName: string;
  emoji: string;
  ts: number;
}

// Event payloads
export interface RoomCreatePayload { name: string; }
export interface RoomJoinPayload { code: string; name: string; }
export interface RoomCreatedPayload { room: RoomMeta; }
export interface RoomJoinedPayload { room: RoomMeta; members: Member[]; }
export interface MemberJoinedPayload { member: Member; }
export interface MemberLeftPayload { memberId: string; }
export interface SignalPayload { to: string; signalData: unknown; }
export interface RelaySignalPayload { peerId: string; signalData: unknown; }
export interface ChatSendPayload { text: string; senderName: string; }
export interface ReactionSendPayload { emoji: string; senderName: string; }
export interface ControlGrantPayload { targetId: string; }
export interface ControlRevokePayload { targetId: string; }
export interface MemberControlChangedPayload { memberId: string; canControl: boolean; }
export interface ControlRequestedPayload { requestId: string; member: Member; }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `deno test shared/contracts/error.test.ts --sloppy-imports`
Expected: 4 passing.

- [ ] **Step 5: Commit**

```bash
git add shared/contracts/error.ts shared/contracts/error.test.ts shared/contracts/events.ts shared/contracts/types.ts
git commit -m "Feat: adds shared error model and realtime protocol contracts"
```

---

### Task 2: Room code generator

**Files:**
- Create: `server/entities/room-store/room-code.ts`
- Test: `server/entities/room-store/room-code.test.ts`

**Interfaces:**
- Produces: `generateRoomCode(length?: number): string` and `isValidRoomCode(code: string, length?: number): boolean`. Alphabet excludes look-alikes: `abcdefghjkmnpqrstuvwxyz23456789`.

- [ ] **Step 1: Write the failing test**

`server/entities/room-store/room-code.test.ts`:
```ts
import { assertEquals } from "@std/assert";
import { generateRoomCode, isValidRoomCode } from "./room-code.ts";

Deno.test("generateRoomCode returns a code of the requested length", () => {
  assertEquals(generateRoomCode(5).length, 5);
  assertEquals(generateRoomCode(7).length, 7);
});

Deno.test("generateRoomCode avoids ambiguous characters", () => {
  for (let i = 0; i < 100; i++) {
    const code = generateRoomCode();
    assertEquals(/^[abcdefghjkmnpqrstuvwxyz23456789]+$/.test(code), true);
  }
});

Deno.test("generateRoomCode produces varied codes", () => {
  const seen = new Set<string>();
  for (let i = 0; i < 50; i++) seen.add(generateRoomCode());
  assertEquals(seen.size > 1, true);
});

Deno.test("isValidRoomCode accepts valid codes and rejects malformed", () => {
  assertEquals(isValidRoomCode("abcde"), true);
  assertEquals(isValidRoomCode("ABCDE"), false);
  assertEquals(isValidRoomCode("abcd"), false);
  assertEquals(isValidRoomCode(""), false);
  assertEquals(isValidRoomCode("ab1de"), false); // 1 excluded
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
Expected: 4 passing.

- [ ] **Step 5: Commit**

```bash
git add server/entities/room-store/room-code.ts server/entities/room-store/room-code.test.ts
git commit -m "Feat: adds room code generator and validator"
```

---

### Task 3: RoomStore entity

**Files:**
- Create: `server/entities/room-store/room-store.ts`
- Test: `server/entities/room-store/room-store.test.ts`

**Interfaces:**
- Consumes: `generateRoomCode`, `isValidRoomCode` (Task 2); `AppError` (Task 1); `Member`, `MediaSource`, `PlaybackSnapshot`, `RoomMeta` (Task 1).
- Produces:
  - `interface Room { code; hostId; locked; members: Map<string, Member>; mediaSource: MediaSource | null; playback: PlaybackSnapshot; createdAt: number }`
  - `class RoomStore` with `create(hostId, hostName): Room`, `get(code): Room | undefined`, `getOrThrow(code): Room`, `delete(code): void`, `addMember(room, member): void`, `removeMember(room, memberId): Member | undefined`, `memberCount(room): number`, `toMeta(room): RoomMeta`.

- [ ] **Step 1: Write the failing test**

`server/entities/room-store/room-store.test.ts`:
```ts
import { assertEquals, assertRejects } from "@std/assert";
import { RoomStore } from "./room-store.ts";
import { AppError } from "../../../shared/contracts/error.ts";
import type { Member } from "../../../shared/contracts/types.ts";

const now = () => 1000;
const opts = { maxMembers: 15, now, codeLength: 5 };

function viewer(id: string, name: string): Member {
  return { id, name, role: "viewer", canControl: false, joinedAt: now() };
}

Deno.test("create stores a host-owned room and assigns a valid code", () => {
  const store = new RoomStore(opts);
  const room = store.create("sock-1", "Alice");
  assertEquals(room.hostId, "sock-1");
  assertEquals(store.get(room.code)?.hostId, "sock-1");
  assertEquals(room.members.get("sock-1")?.role, "host");
  assertEquals(room.members.get("sock-1")?.canControl, true);
  assertEquals(store.memberCount(room), 1);
});

Deno.test("create rejects an empty host name", () => {
  const store = new RoomStore(opts);
  assertRejects(
    () => Promise.resolve().then(() => store.create("sock-1", "   ")),
    AppError,
    "name",
  );
});

Deno.test("get returns undefined for unknown or malformed codes", () => {
  const store = new RoomStore(opts);
  assertEquals(store.get("zzzzz"), undefined);
  assertEquals(store.get("!!!"), undefined);
});

Deno.test("addMember adds viewers and enforces capacity", () => {
  const store = new RoomStore(opts);
  const room = store.create("host", "H");
  for (let i = 0; i < 14; i++) store.addMember(room, viewer(`v${i}`, `v${i}`));
  assertEquals(store.memberCount(room), 15);
  assertRejects(
    () => Promise.resolve().then(() => store.addMember(room, viewer("extra", "x"))),
    AppError,
    "full",
  );
});

Deno.test("addMember rejects joining a locked room as a viewer", () => {
  const store = new RoomStore(opts);
  const room = store.create("host", "H");
  room.locked = true;
  assertRejects(
    () => Promise.resolve().then(() => store.addMember(room, viewer("v1", "V"))),
    AppError,
    "locked",
  );
});

Deno.test("removeMember removes and returns the member", () => {
  const store = new RoomStore(opts);
  const room = store.create("host", "H");
  store.addMember(room, viewer("v1", "V"));
  const removed = store.removeMember(room, "v1");
  assertEquals(removed?.id, "v1");
  assertEquals(store.memberCount(room), 1);
});

Deno.test("toMeta reflects current membership", () => {
  const store = new RoomStore(opts);
  const room = store.create("host", "H");
  store.addMember(room, viewer("v1", "V"));
  const meta = store.toMeta(room);
  assertEquals(meta.hostId, "host");
  assertEquals(meta.memberCount, 2);
  assertEquals(meta.maxMembers, 15);
  assertEquals(meta.locked, false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `deno test server/entities/room-store/room-store.test.ts --sloppy-imports`
Expected: FAIL — module `./room-store.ts` not found.

- [ ] **Step 3: Implement**

`server/entities/room-store/room-store.ts`:
```ts
import { AppError } from "../../../shared/contracts/error.ts";
import type {
  Member,
  MediaSource,
  PlaybackSnapshot,
  RoomMeta,
} from "../../../shared/contracts/types.ts";
import { generateRoomCode, isValidRoomCode } from "./room-code.ts";

export interface Room {
  code: string;
  hostId: string;
  locked: boolean;
  members: Map<string, Member>;
  mediaSource: MediaSource | null;
  playback: PlaybackSnapshot;
  createdAt: number;
}

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
Expected: 7 passing.

- [ ] **Step 5: Commit**

```bash
git add server/entities/room-store/room-store.ts server/entities/room-store/room-store.test.ts
git commit -m "Feat: adds in-memory RoomStore with capacity and lock enforcement"
```

---

### Task 4: PlaybackState sync engine

**Files:**
- Create: `server/entities/playback/playback-state.ts`
- Test: `server/entities/playback/playback-state.test.ts`

**Interfaces:**
- Consumes: `PlaybackSnapshot`, `PlaybackStatus` (Task 1).
- Produces: `class PlaybackState` with deps `{ now(): number; driftThresholdMs: number; seekStepSeconds: number }`, constructor takes an initial `PlaybackSnapshot`, and methods: `getSnapshot()`, `play()`, `pause()`, `seek(time)`, `forward(step?)`, `rewind(step?)`, `setDuration(duration)`, `projected(now)`, `driftMs(viewerPositionMs, now)`, `isDriftAcceptable(driftMs)`. All `*` control methods return the projected `PlaybackSnapshot`.

- [ ] **Step 1: Write the failing test**

`server/entities/playback/playback-state.test.ts`:
```ts
import { assertEquals } from "@std/assert";
import { PlaybackState } from "./playback-state.ts";
import type { PlaybackSnapshot } from "../../../shared/contracts/types.ts";

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
  const deps = {
    now: () => clock,
    driftThresholdMs: 1500,
    seekStepSeconds: 10,
    setTime: (t: number) => { clock = t; },
  };
  const state = new PlaybackState(deps, initial);
  return { state, deps };
}

Deno.test("paused state does not advance over time", () => {
  const { state, deps } = makeState({ status: "paused", currentTime: 30 });
  deps.setTime(101_000);
  assertEquals(state.getSnapshot().currentTime, 30);
});

Deno.test("playing state projects currentTime forward at rate", () => {
  const { state, deps } = makeState({ status: "playing", currentTime: 30, rate: 1 });
  deps.setTime(102_000); // +2s
  const snap = state.getSnapshot();
  assertEquals(snap.currentTime, 32);
});

Deno.test("pause freezes at the projected time", () => {
  const { state, deps } = makeState({ status: "playing", currentTime: 30 });
  deps.setTime(101_500); // +1.5s -> 31.5
  const snap = state.pause();
  assertEquals(snap.status, "paused");
  assertEquals(snap.currentTime, 31.5);
});

Deno.test("seek clamps to duration and stays paused", () => {
  const { state } = makeState({ status: "paused", currentTime: 30, duration: 120 });
  assertEquals(state.seek(500).currentTime, 120);
  assertEquals(state.seek(-5).currentTime, 0);
  assertEquals(state.seek(50).currentTime, 50);
});

Deno.test("forward and rewind step by configured seconds", () => {
  const { state } = makeState({ status: "paused", currentTime: 50 });
  assertEquals(state.forward().currentTime, 60);
  assertEquals(state.rewind().currentTime, 50);
});

Deno.test("playing + seek resumes advancing from the new position", () => {
  const { state, deps } = makeState({ status: "playing", currentTime: 10 });
  deps.setTime(100_500);
  state.seek(20);
  deps.setTime(101_000); // +0.5s after seek
  assertEquals(state.getSnapshot().currentTime, 20.5);
});

Deno.test("drift detection reports signed difference", () => {
  const { state } = makeState({ status: "playing", currentTime: 30 });
  // viewer 1.2s behind
  assertEquals(state.driftMs(28_800, 100_000), -1200);
});

Deno.test("drift acceptability respects the threshold", () => {
  const { state } = makeState({});
  assertEquals(state.isDriftAcceptable(1200), true);
  assertEquals(state.isDriftAcceptable(1600), false);
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
} from "../../../shared/contracts/types.ts";

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
Expected: 9 passing.

- [ ] **Step 5: Commit**

```bash
git add server/entities/playback/playback-state.ts server/entities/playback/playback-state.test.ts
git commit -m "Feat: adds pure PlaybackState sync engine with drift detection"
```

---

### Task 5: Permissions model

**Files:**
- Create: `server/entities/member/permissions.ts`
- Test: `server/entities/member/permissions.test.ts`

**Interfaces:**
- Consumes: `Member` (Task 1), `AppError` (Task 1).
- Produces: `isHost(member)`, `canControlRoom(member)`, `assertCanControl(member)`, `grantControl(actor, target): void` (throws if actor can't grant; target becomes `canControl = true`), `revokeControl(actor, target): void` (host-only; host targets are no-ops).

- [ ] **Step 1: Write the failing test**

`server/entities/member/permissions.test.ts`:
```ts
import { assertEquals, assertThrows } from "@std/assert";
import { AppError } from "../../../shared/contracts/error.ts";
import type { Member } from "../../../shared/contracts/types.ts";
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

Deno.test("host can always control the room", () => {
  const host = member({ role: "host" });
  assertEquals(isHost(host), true);
  assertEquals(canControlRoom(host), true);
});

Deno.test("viewer with canControl flag can control the room", () => {
  assertEquals(canControlRoom(member({ canControl: true })), true);
  assertEquals(canControlRoom(member()), false);
});

Deno.test("assertCanControl throws for a plain viewer", () => {
  assertThrows(() => assertCanControl(member()), AppError, "permission");
});

Deno.test("grantControl flips the target flag and requires a grantor", () => {
  const actor = member({ role: "host" });
  const target = member();
  grantControl(actor, target);
  assertEquals(target.canControl, true);
  assertThrows(() => grantControl(member(), member()), AppError, "permission");
});

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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `deno test server/entities/member/permissions.test.ts --sloppy-imports`
Expected: FAIL — module `./permissions.ts` not found.

- [ ] **Step 3: Implement**

`server/entities/member/permissions.ts`:
```ts
import { AppError } from "../../../shared/contracts/error.ts";
import type { Member } from "../../../shared/contracts/types.ts";

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
Expected: 5 passing.

- [ ] **Step 5: Commit**

```bash
git add server/entities/member/permissions.ts server/entities/member/permissions.test.ts
git commit -m "Feat: adds room control permissions model"
```

---

### Task 6: Structured logger + socket utils

**Files:**
- Create: `server/shared/logger/logger.ts`
- Test: `server/shared/logger/logger.test.ts`
- Create: `server/shared/socket-utils.ts`
- Test: `server/shared/socket-utils.test.ts`

**Interfaces:**
- Produces: `type LogLevel = "debug" | "info" | "warn" | "error"`; `interface Logger { debug/info/warn/error(msg, fields?) }`; `createLogger({ level, sink? }): Logger`. `currentRoom(socket: Socket): string | undefined` returns the first room name that isn't the socket id.

- [ ] **Step 1: Write the failing tests**

`server/shared/logger/logger.test.ts`:
```ts
import { assertEquals } from "@std/assert";
import { createLogger } from "./logger.ts";

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

Deno.test("currentRoom returns the first non-self room name", () => {
  const fakeSocket = {
    id: "sock-1",
    rooms: new Set(["sock-1", "abcde"]),
  } as unknown as { id: string; rooms: Set<string> };
  assertEquals(currentRoom(fakeSocket), "abcde");
});

Deno.test("currentRoom returns undefined when in no room", () => {
  const fakeSocket = {
    id: "sock-1",
    rooms: new Set(["sock-1"]),
  } as unknown as { id: string; rooms: Set<string> };
  assertEquals(currentRoom(fakeSocket), undefined);
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
Expected: 4 passing.

- [ ] **Step 5: Commit**

```bash
git add server/shared/logger/logger.ts server/shared/logger/logger.test.ts server/shared/socket-utils.ts server/shared/socket-utils.test.ts
git commit -m "Feat: adds structured logger and socket room helper"
```

---

### Task 7: Signaling feature

**Files:**
- Create: `server/features/signaling/signaling-handler.ts`
- Test: `server/features/signaling/signaling-handler.test.ts`

**Interfaces:**
- Consumes: `SOCKET_EVENTS` (Task 1), `SignalPayload`/`RelaySignalPayload` (Task 1), `AppError` (Task 1), `currentRoom` (Task 6), `Logger` (Task 6).
- Produces: `class SignalingHandler` with `constructor({ io, logger })` and `attach(): void`. On `SOCKET_EVENTS.SIGNAL`, relays `{ peerId, signalData }` to `payload.to` if present, otherwise to the socket's current room.

- [ ] **Step 1: Write the failing test**

`server/features/signaling/signaling-handler.test.ts`:
```ts
import { assertEquals } from "@std/assert";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { io as ClientIO, type Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "../../../shared/contracts/events.ts";
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `deno test server/features/signaling/signaling-handler.test.ts --sloppy-imports`
Expected: FAIL — module `./signaling-handler.ts` not found.

- [ ] **Step 3: Implement**

`server/features/signaling/signaling-handler.ts`:
```ts
import type { Server, Socket } from "socket.io";
import { SOCKET_EVENTS } from "../../../shared/contracts/events.ts";
import type {
  RelaySignalPayload,
  SignalPayload,
} from "../../../shared/contracts/types.ts";
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
    socket.on(SOCKET_EVENTS.SIGNAL, (payload: SignalPayload) =>
      this.onSignal(socket, payload)
    );
  }

  private onSignal(socket: Socket, payload: SignalPayload): void {
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
Expected: 1 passing.

- [ ] **Step 5: Commit**

```bash
git add server/features/signaling/signaling-handler.ts server/features/signaling/signaling-handler.test.ts
git commit -m "Feat: adds socket.io signaling relay"
```

---

### Task 8: Room feature (create / join / lock / leave / host-disconnect)

**Files:**
- Create: `server/features/room/room-handler.ts`
- Test: `server/features/room/room-handler.test.ts`

**Interfaces:**
- Consumes: `RoomStore` (Task 3), `SOCKET_EVENTS` + payload types (Task 1), `AppError` (Task 1), `Logger` (Task 6).
- Produces: `class RoomHandler` with `constructor({ io, rooms, logger })` and `attach()`. Handles `ROOM_CREATE`, `ROOM_JOIN`, `ROOM_LOCK`, `ROOM_UNLOCK`, `ROOM_LEAVE`, and `disconnect`. Emits `ROOM_CREATED`, `ROOM_JOINED`, `MEMBER_JOINED`, `MEMBER_LEFT`, `ROOM_LOCKED`, `ROOM_UNLOCKED`, `ROOM_ENDED`, `APP_ERROR`.

- [ ] **Step 1: Write the failing test**

`server/features/room/room-handler.test.ts`:
```ts
import { assertEquals } from "@std/assert";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { io as ClientIO, type Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "../../../shared/contracts/events.ts";
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

Deno.test("host disconnect ends the room for viewers", async () => {
  const h = await makeHarness();
  try {
    const host = await h.connect();
    const createdP = h.waitFor<{ room: { code: string } }>(host, SOCKET_EVENTS.ROOM_CREATED);
    host.emit(SOCKET_EVENTS.ROOM_CREATE, { name: "Alice" });
    const { room } = await createdP;

    const viewer = await h.connect();
    const joinedP = h.waitFor<{ room: { code: string } }>(viewer, SOCKET_EVENTS.ROOM_JOINED);
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `deno test server/features/room/room-handler.test.ts --sloppy-imports`
Expected: FAIL — module `./room-handler.ts` not found.

- [ ] **Step 3: Implement**

`server/features/room/room-handler.ts`:
```ts
import type { Server, Socket } from "socket.io";
import { SOCKET_EVENTS } from "../../../shared/contracts/events.ts";
import { AppError } from "../../../shared/contracts/error.ts";
import type {
  Member,
  MemberJoinedPayload,
  MemberLeftPayload,
  RoomCreatedPayload,
  RoomJoinPayload,
  RoomJoinedPayload,
  RoomCreatePayload,
} from "../../../shared/contracts/types.ts";
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
Expected: 4 passing.

- [ ] **Step 5: Commit**

```bash
git add server/features/room/room-handler.ts server/features/room/room-handler.test.ts
git commit -m "Feat: adds room create/join/lock/terminate handlers"
```

---

### Task 9: Chat feature (rate-limited relay)

**Files:**
- Create: `server/features/chat/chat-handler.ts`
- Test: `server/features/chat/chat-handler.test.ts`

**Interfaces:**
- Consumes: `SOCKET_EVENTS` + `ChatMessage`/`ChatSendPayload` (Task 1), `AppError` (Task 1), `currentRoom` (Task 6), `Logger` (Task 6).
- Produces: `class ChatHandler` with `constructor({ io, logger, maxMessageLength?, messagesPerWindow? })` and `attach()`. Handles `CHAT_SEND`, emits `CHAT_MESSAGE` to the room. Rate-limits per socket (default 5 msgs / 2s). Invalid length → `APP_ERROR` with `VALIDATION_CODE_MALFORMED`.

- [ ] **Step 1: Write the failing test**

`server/features/chat/chat-handler.test.ts`:
```ts
import { assertEquals } from "@std/assert";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { io as ClientIO, type Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "../../../shared/contracts/events.ts";
import { RoomStore } from "../../entities/room-store/room-store.ts";
import { RoomHandler } from "../room/room-handler.ts";
import { createLogger } from "../../shared/logger/logger.ts";
import { ChatHandler } from "./chat-handler.ts";

function silentLogger() {
  return createLogger({ level: "error", sink: () => {} });
}

async function makeHarness() {
  const httpServer: Server = createServer();
  const io = new SocketIOServer(httpServer, { cors: { origin: "*" } });
  const rooms = new RoomStore({ maxMembers: 15, now: () => Date.now(), codeLength: 5 });
  new RoomHandler({ io, rooms, logger: silentLogger() }).attach();
  new ChatHandler({ io, logger: silentLogger(), maxMessageLength: 500, messagesPerWindow: 3, windowMs: 2000 }).attach();
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

  return { io, httpServer, connect, waitFor };
}

Deno.test("chat message is relayed to the room with sender metadata", async () => {
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

    const msgOnHost = h.waitFor<{ text: string; senderName: string }>(host, SOCKET_EVENTS.CHAT_MESSAGE);
    viewer.emit(SOCKET_EVENTS.CHAT_SEND, { text: "hi everyone", senderName: "Bob" });
    const msg = await msgOnHost;
    assertEquals(msg.text, "hi everyone");
    assertEquals(msg.senderName, "Bob");
    host.disconnect();
    viewer.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(r));
  }
});

Deno.test("oversized chat message is rejected with a typed error", async () => {
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
    viewer.emit(SOCKET_EVENTS.CHAT_SEND, { text: "x".repeat(501), senderName: "Bob" });
    const err = await errP;
    assertEquals(err.code, "VALIDATION_CODE_MALFORMED");
    host.disconnect();
    viewer.disconnect();
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
import { SOCKET_EVENTS } from "../../../shared/contracts/events.ts";
import { AppError } from "../../../shared/contracts/error.ts";
import type {
  ChatMessage,
  ChatSendPayload,
} from "../../../shared/contracts/types.ts";
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

  constructor(deps: ChatHandlerDeps) {
    this.io = deps.io;
    this.logger = deps.logger;
    this.maxMessageLength = deps.maxMessageLength ?? 500;
    this.messagesPerWindow = deps.messagesPerWindow ?? 5;
    this.windowMs = deps.windowMs ?? 2000;
  }

  private readonly io: Server;
  private readonly logger: Logger;

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
Expected: 2 passing.

- [ ] **Step 5: Commit**

```bash
git add server/features/chat/chat-handler.ts server/features/chat/chat-handler.test.ts
git commit -m "Feat: adds rate-limited chat relay"
```

---

### Task 10: Reactions feature (relay)

**Files:**
- Create: `server/features/reactions/reaction-handler.ts`
- Test: `server/features/reactions/reaction-handler.test.ts`

**Interfaces:**
- Consumes: `SOCKET_EVENTS` + `Reaction`/`ReactionSendPayload` (Task 1), `currentRoom` (Task 6).
- Produces: `class ReactionHandler` with `constructor({ io, logger })` and `attach()`. Handles `REACTION_SEND`, emits `REACTION` to the room. Emoji must be in an allowlist; otherwise ignored.

- [ ] **Step 1: Write the failing test**

`server/features/reactions/reaction-handler.test.ts`:
```ts
import { assertEquals } from "@std/assert";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { io as ClientIO, type Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "../../../shared/contracts/events.ts";
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

  return { io, httpServer, connect, waitFor };
}

Deno.test("reaction is relayed to the room", async () => {
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

    const reactionP = h.waitFor<{ emoji: string; senderName: string }>(host, SOCKET_EVENTS.REACTION);
    viewer.emit(SOCKET_EVENTS.REACTION_SEND, { emoji: "🔥", senderName: "Bob" });
    const reaction = await reactionP;
    assertEquals(reaction.emoji, "🔥");
    assertEquals(reaction.senderName, "Bob");
    host.disconnect();
    viewer.disconnect();
  } finally {
    h.io.close();
    await new Promise<void>((r) => h.httpServer.close(r));
  }
});

Deno.test("disallowed emoji is ignored", async () => {
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

    let emitted = false;
    host.on(SOCKET_EVENTS.REACTION, () => { emitted = true; });
    viewer.emit(SOCKET_EVENTS.REACTION_SEND, { emoji: "🦄", senderName: "Bob" });
    await new Promise((r) => setTimeout(r, 300));
    assertEquals(emitted, false);
    host.disconnect();
    viewer.disconnect();
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
import { SOCKET_EVENTS } from "../../../shared/contracts/events.ts";
import type {
  Reaction,
  ReactionSendPayload,
} from "../../../shared/contracts/types.ts";
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
Expected: 2 passing.

- [ ] **Step 5: Commit**

```bash
git add server/features/reactions/reaction-handler.ts server/features/reactions/reaction-handler.test.ts
git commit -m "Feat: adds emoji reaction relay with allowlist"
```

---

### Task 11: Server bootstrap (config + app entry)

**Files:**
- Create: `server/app/config.ts`
- Test: `server/app/config.test.ts`
- Create: `server/app/server.ts`
- Modify: `deno.json` (add `tasks.dev`, `tasks.start`, imports alias `contracts/`)

**Interfaces:**
- Consumes: all features (Tasks 7-10), `RoomStore` (Task 3), `Logger` (Task 6), Express + React Router handler.
- Produces: `loadConfig(env): AppConfig` and `startServer(config, logger): Promise<http.Server>`. The server is plain HTTP (no TLS), serves `/healthz`, mounts Socket.IO with all handlers, and serves the React Router app (Vite middleware in dev, static build in production).

- [ ] **Step 1: Write the failing test**

`server/app/config.test.ts`:
```ts
import { assertEquals } from "@std/assert";
import { loadConfig } from "./config.ts";

Deno.test("loadConfig uses defaults when env is empty", () => {
  const cfg = loadConfig({});
  assertEquals(cfg.nodeEnv, "development");
  assertEquals(cfg.port, 5173);
  assertEquals(cfg.maxRoomSize, 15);
  assertEquals(cfg.clientBuildPath, "./build/client");
});

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

export function loadConfig(
  env: Record<string, string | undefined> = Deno.env.toObject(),
): AppConfig {
  return {
    nodeEnv: env.NODE_ENV === "production" ? "production" : "development",
    port: Number(env.PORT ?? 5173),
    maxRoomSize: Number(env.MAX_ROOM_SIZE ?? 15),
    corsOrigin: env.CORS_ORIGIN ?? "*",
    clientBuildPath: env.CLIENT_BUILD_PATH ?? "./build/client",
    serverBuildPath: env.SERVER_BUILD_PATH ?? "./build/server/index.js",
  };
}
```

- [ ] **Step 4: Run config test to verify it passes**

Run: `deno test server/app/config.test.ts --sloppy-imports`
Expected: 2 passing.

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
- Create: `app/shared/api/socket-client.ts`
- Test: `app/shared/api/socket-client.test.ts`
- Create: `app/shared/api/sync-engine-client.ts`
- Test: `app/shared/api/sync-engine-client.test.ts`

**Interfaces:**
- Consumes: `SOCKET_EVENTS`, `AppError`, payload types via `contracts/` alias (Task 1); `PlaybackState` concepts.
- Produces:
  - `createSocketClient(opts: { url: string }): SocketClient` where `SocketClient` wraps a socket.io client with typed methods: `createRoom(name)`, `joinRoom(code, name)`, `sendChat(text)`, `sendReaction(emoji)`, `grantControl(targetId)`, `revokeControl(targetId)`, `on(...)` typed event registrations, and `getSocketId()`. Emits/throws `AppError` on `APP_ERROR`.
  - `createSyncEngineClient(deps): SyncEngineClient` with `applySnapshot(snapshot)`, `computeCorrection(snapshot, videoCurrentTime, now)`, and `driftStatus()`.

- [ ] **Step 1: Write the failing tests**

`app/shared/api/sync-engine-client.test.ts` (pure — no sockets):
```ts
import { assertEquals } from "@std/assert";
import { createSyncEngineClient } from "./sync-engine-client.ts";

Deno.test("applies a snapshot as the current sync state", () => {
  const engine = createSyncEngineClient({ driftThresholdMs: 1500 });
  engine.applySnapshot({ status: "paused", currentTime: 30, duration: 120, rate: 1, updatedAt: 100_000 });
  const snap = engine.getSnapshot();
  assertEquals(snap.status, "paused");
  assertEquals(snap.currentTime, 30);
});

Deno.test("projects playing state forward from the snapshot timestamp", () => {
  const engine = createSyncEngineClient({ driftThresholdMs: 1500 });
  engine.applySnapshot({ status: "playing", currentTime: 30, duration: 120, rate: 1, updatedAt: 100_000 });
  const projected = engine.projectAt(102_000);
  assertEquals(projected.currentTime, 32);
});

Deno.test("reports drift status against the threshold", () => {
  const engine = createSyncEngineClient({ driftThresholdMs: 1500 });
  engine.applySnapshot({ status: "playing", currentTime: 30, duration: 120, rate: 1, updatedAt: 100_000 });
  assertEquals(engine.driftStatus(30_000, 100_000), "in-sync");
  assertEquals(engine.driftStatus(27_000, 100_000), "behind");
  assertEquals(engine.driftStatus(33_000, 100_000), "ahead");
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `deno test app/shared/api/sync-engine-client.test.ts --sloppy-imports`
Expected: FAIL — module `./sync-engine-client.ts` not found.

- [ ] **Step 3: Implement the client sync engine**

`app/shared/api/sync-engine-client.ts`:
```ts
import type { PlaybackSnapshot } from "contracts/types.ts";

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
Expected: 3 passing.

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
```

- [ ] **Step 6: Run socket-client test to verify it fails**

Run: `deno test app/shared/api/socket-client.test.ts --sloppy-imports`
Expected: FAIL — module `./socket-client.ts` not found.

- [ ] **Step 7: Implement the socket client**

`app/shared/api/socket-client.ts`:
```ts
import { io, type Socket } from "socket.io-client";
import { SOCKET_EVENTS } from "contracts/events.ts";
import { AppError } from "contracts/error.ts";
import type {
  RoomCreatePayload,
  RoomCreatedPayload,
  RoomJoinPayload,
  RoomJoinedPayload,
  MemberJoinedPayload,
  MemberLeftPayload,
  ChatMessage,
  Reaction,
  ControlGrantPayload,
  ControlRevokePayload,
  SignalPayload,
  RelaySignalPayload,
} from "contracts/types.ts";

export interface SocketClientDeps {
  url: string;
}

export interface SocketClient {
  createRoom(name: string): Promise<RoomCreatedPayload["room"]>;
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

  function request<T>(key: string, event: string, payload: unknown): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      pending.set("error", reject);
      pending.set(key, (p: unknown) => resolve(p as T));
      socket.emit(event, payload);
    });
  }

  return {
    createRoom(name) {
      const payload: RoomCreatePayload = { name };
      return request<RoomCreatedPayload>("create", SOCKET_EVENTS.ROOM_CREATE, payload)
        .then((p) => p.room);
    },
    joinRoom(code, name) {
      const payload: RoomJoinPayload = { code, name };
      return request<RoomJoinedPayload>("join", SOCKET_EVENTS.ROOM_JOIN, payload);
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
Expected: 1 passing.

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
- **Type consistency:** `PlaybackSnapshot`, `Member`, `RoomMeta`, `AppError`, `SOCKET_EVENTS`, `RoomStore`, `PlaybackState` names match across tasks. `contracts/` alias resolves for the client; relative `../shared/contracts` for the server.

**Phase 2 (UI)** will be a separate plan: FSD restructure of `app/`, Zustand wiring, and the Apple HIG design system via `impeccable`.
