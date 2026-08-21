# PRODUCT-MODEL.md — what this product actually is, today

The **as-built** model of The Sync Party: what exists, how far it is wired, what
the product deliberately does not do, and what its words mean. Every feature
proposal is checked against this document before anything is designed.

**Derived from the code, not from intent.** Where this contradicts the PRD, this
document describes reality and the PRD describes the plan; both are true about
different things. Verified against the tree on **2026-08-19** (branch
`refactor/fsd-rewrite`).

## What lives elsewhere

| Question | Owner |
|---|---|
| Who the users are, product purpose, journey direction, expectations, brand personality, anti-references | `PRODUCT.md` |
| Colour, typography, layout, motion, components, design rules of thumb | `DESIGN.md` |
| The v2 plan and target architecture | `docs/specs/2026-08-08-sync-party-v2-prd.md` |
| How code rules are enforced | `docs/GOVERNANCE.md` |
| Pipeline stages, artifacts, gates | `docs/PIPELINE.md` |
| Product decisions and their rationale | `docs/DECISIONS.md` |

This document adds only what none of those carry: the **as-built capability
inventory with wiring status**, the **terminology ontology**, and the **closed list
of dimensions this product does not have**.

## Wiring status — read this before using the capability table

A capability's *name* existing is not the same as the capability *working*. Using a
plain capability list to answer "does this already exist?" produces catastrophic
false positives — it would reject building playback sync on the grounds that sync
is already specified. Every capability therefore carries one of:

| Status | Meaning |
|---|---|
| `LIVE` | reachable from the boot path and functioning end to end |
| `PARTIAL` | reachable and working, but incomplete in a stated way |
| `UNWIRED` | code exists across several layers with **no end-to-end path** connecting them |
| `CONTRACT-ONLY` | declared in `shared/contracts/`, no implementation on either side |
| `DEAD` | implemented, zero importers, unreachable |

**Only `LIVE` and `PARTIAL` may be cited as "this already exists."** `UNWIRED`,
`CONTRACT-ONLY`, and `DEAD` are *the opposite* — they are evidence that the work is
outstanding, and a proposal to complete one is a legitimate feature, not a
duplicate.

## Capability inventory

### Rooms and membership

| Capability | Status | Evidence |
|---|---|---|
| Create a room (5-char code, creator becomes host) | `LIVE` | `server/features/room/room-handler.ts:37`, `server/entities/room-store/room-code.ts:1` |
| Join a room by code (validates exists / not locked / capacity) | `LIVE` | `server/features/room/room-handler.ts:60` |
| Room ends on host disconnect, viewers notified | `LIVE` | `server/features/room/room-handler.ts:115` |
| Lock / unlock a room, host-only, server-enforced | `UNWIRED` | server logic at `server/features/room/room-handler.ts:99`; **no client emitter** for `ROOM_LOCK`/`ROOM_UNLOCK` anywhere in `app/` |
| Member list / presence | `LIVE` | `MEMBER_JOINED`/`MEMBER_LEFT` broadcast, `server/features/room/room-handler.ts:85` |

### Playback

| Capability | Status | Evidence |
|---|---|---|
| Host streams local video to viewers (star topology, one peer per member) | `LIVE` | `app/widgets/player-shell/logic/use-peer-media-stream.ts:16` |
| WebRTC signaling relay (offer / answer / ICE) | `LIVE` | `server/features/signaling/signaling-handler.ts:20` |
| Local playback commands (play / pause / seek / forward / rewind) | `PARTIAL` | `app/features/playback-control/model/playback-behaviour.ts:14` — mutates local state only; permission gate is **client-side only** |
| **Synchronized playback state between host and viewers** | `CONTRACT-ONLY` | `shared/contracts/data-channel-messages.ts` (`sync:state`, `sync:command`, `sync:drift`, `media:ready`) has **zero usages** in `app/` or `server/` |
| Drift detection and correction math | `UNWIRED` | `app/shared/api/sync-engine-client.ts:1` is pure and unit-tested but **unreached**; nothing feeds it |
| Media-source selection (local file or URL) | `LIVE` | `shared/contracts/media-source.ts:1`, `app/features/media-source/model/*` |

> The product's defining capability — synchronized playback — is **not wired**.
> This is the single most important fact in this document.

### Control delegation

| Capability | Status | Evidence |
|---|---|---|
| Host grants / revokes playback control to a viewer | `UNWIRED` | Three disconnected layers: client mutates a local store (`app/features/room-controls/model/host-tools-behaviour.ts:9`); `server/entities/member/permissions.ts` has **zero callers** outside its own test; `socket-client.ts:122` emitters have **zero call sites**; no server handler for `CONTROL_GRANT`/`CONTROL_REVOKE` exists |
| Viewer requests control / host approves | `CONTRACT-ONLY` | `CONTROL_REQUEST`, `CONTROL_APPROVE`, `CONTROL_REQUESTED`, `MEMBER_CONTROL_CHANGED` declared; no emitter or handler on either side |

### Social

| Capability | Status | Evidence |
|---|---|---|
| Text chat, 500-char cap, 5 msgs / 2000ms rate limit | `LIVE` | `server/features/chat/chat-handler.ts:44` |
| Emoji reactions, fixed 5-emoji allowlist (👍😂😮❤️🔥) | `LIVE` | `server/features/reactions/reaction-handler.ts:26`, `shared/contracts/reaction-emojis.ts:1` |

### Supporting

| Capability | Status | Evidence |
|---|---|---|
| Movie metadata lookup via TMDB | `LIVE` | `server/features/metadata/metadata-tmdb.ts:14` |
| Graded error surfaces (inline / banner / screen / global) | `LIVE` | `app/shared/ui-kit/{inline-error,error-banner,error-screen}.tsx`, `app/widgets/error-surface/ui/error-surface.tsx` |
| Toasts | `LIVE` | `app/shared/ui-kit/toast.tsx:12` |
| Chrome auto-hide on idle | `LIVE` | `app/widgets/player-shell/logic/use-idle-visibility.ts` |
| Legacy URL-upload flow (pre-FSD peer/socket managers) | `DEAD` | `app/features/{webRTC,webSocket,videoPlayback}/**` — no live route imports them |

## Navigable surface

Routing is `flatRoutes()` over `app/routes/` only (`app/routes.ts:1`).

| Route | Screen |
|---|---|
| `/` | landing (`app/features/entry-flow/components/landing-screen.tsx`) |
| `/:id/SetupScreen` | setup |
| `/:id/file-upload` | source selection |
| `/:id/HostVideoPlayerNew` | host pre-play / playback |
| `/:id/RecieverVideoPlayerNew` | viewer player (**misspelling is in the live URL** — see grandfathered terms) |

`app/pages/**` (5 files) is `DEAD`: zero importers.

## Product boundaries — what this product does not do

Each is a deliberate non-goal, not a gap. Cited to `docs/specs/2026-08-08-sync-party-v2-prd.md`.

- **Does not host, store, or transcode video.** For a local file the host's browser
  streams it peer-to-peer; for a URL each peer loads it independently and only
  playback state is meant to sync. There is no server-side media storage or CDN.
- **No user accounts or authentication** (PRD §1.2). A member *is* a socket id.
- **No persistence** — rooms are in-memory; no room history or favourites.
- **No SFU / media server.** P2P `simple-peer` only.
- **No viewer↔viewer media.** Host→viewer only; topology is a star.
- **Capacity ~15 viewers**, enforced server-side.
- **No offline playback or DVR.**
- **No native mobile app.**

## Roles

Exactly two: `"host" | "viewer"` (`shared/contracts/member.ts:1`).

**Authorization is thin and partly fictional.** Server-authoritative checks exist
only for room create, lock/unlock, and host-disconnect termination
(`server/features/room/room-handler.ts:103`). Playback control and grant/revoke are
gated **client-side only**, against a `Member` object the client asserts about
itself, and no server handler for control changes exists at all. A modified client
faces no server pushback. Treat "permission" in this product as advisory, not
enforced, until that changes.

Rate limiting exists for chat only.

## Domain concepts

| Concept | Identity | Defined at | Identity typing |
|---|---|---|---|
| Room | `code: string` | `shared/contracts/room-meta.ts:3` | bare `string` |
| Member | `id: string` (= socket id) | `shared/contracts/member.ts:3` | bare `string` |
| PlaybackSnapshot | one per room | `shared/contracts/playback.ts:3` | — |
| MediaSource | `{mode:"upload"} \| {mode:"url", url}` | `shared/contracts/media-source.ts:1` | — |
| ChatMessage | `id` (nanoid) | `shared/contracts/chat-message.ts:1` | bare `string` |
| Reaction | `senderId` + `ts` | `shared/contracts/reaction.ts:1` | — |
| AppError | `code: ErrorCode` | `shared/contracts/app-error.ts` | — |

A `Room` owns a `Map<string, Member>`, one optional `MediaSource`, and one
`PlaybackSnapshot`. **No branded id types exist anywhere** — every id is a bare
`string`, so a `MemberId` is currently assignable where a room code belongs.

## Terminology ontology — machine-checked

`deno task terminology:check` enforces this. New code and new docs must use the
canonical term; existing occurrences are frozen by a ratchet exactly as structural
violations are, so this converts vocabulary drift from a review opinion into a
build failure without demanding a repo-wide rename first.

### Canonical terms and banned synonyms

| Concept | Canonical | Banned as a synonym | Notes |
|---|---|---|---|
| the shared viewing space | **room** | `party`, `lobby`, `session` (for this meaning) | `party` is permitted in **user-facing copy and brand** only ("start a party"), never as a code noun. `lobby` is unused — keep it that way. |
| a person in a room | **member** | `participant`, `guest`, `user`, `attendee` | `PRODUCT.md` uses "participants" in prose; prefer "member" or a role name going forward. |
| the non-host role | **viewer** | `receiver`, `watcher`, `audience` | `viewer` is the value in `MemberRole`. |
| the controlling role | **host** | `owner`, `admin`, `presenter` | |
| the thing being watched | **media source** | `video file`, `content`, `media` (bare) | `MediaSource` is the type. |

### Distinct terms that only look like synonyms

A naive synonym check would wrongly collapse these. They are **different
concepts** and must stay separate:

| Term | Means | Not to be confused with |
|---|---|---|
| **session** | the local browser's user-identity context (`app/context/Session/`, holds `roomId` + `userName`) | **room** — a session is client-local; a room is server-owned and shared |
| **peer** | a WebRTC connection object (`SimplePeer.Instance`) | **member** — one member may have zero or many peer connections |
| playback **action** (`play`/`pause`/`seek`/`forward`/`rewind`) | a command a user issues | playback **status** (`playing`/`paused`/`ended`) — a state the snapshot reports |

### Grandfathered — frozen, never extended

| Term | Where | Rule |
|---|---|---|
| `Reciever*` (misspelling of `Receiver`) | 15 occurrences in 8 files, **including the live route `/:id/RecieverVideoPlayerNew`** | Existing occurrences are frozen; **any new occurrence fails the check**. Renaming would change a live URL, so it is deliberately out of scope. `AGENTS.md:142` already mandates correct spelling in new code. |
| legacy `Role` type (`app/context/Session/contracts/Role.ts`) | parallel to `MemberRole` in `shared/contracts/member.ts` | Frozen. New code uses `MemberRole`. |
| legacy socket event constants (`app/features/{webRTC,webSocket}/contracts/constants.ts`) | a second wire vocabulary in the dead legacy zone | Frozen. New code uses `shared/contracts/socket-events.ts`. |

## Dimensions this product does not have — closed list

A feature proposal must mark each of these `N/A — this product has no <X>` and
perform **no analysis** of it. Filling an empty impact row is how invented
diligence enters a spec, and invented diligence is more dangerous than an
acknowledged blank because it reads as rigour.

`billing / pricing / plans` · `user accounts or persistent identity` ·
`database or any persistence beyond in-memory` · `analytics, telemetry, or
instrumentation of any kind` · `feature flags` · `localization / i18n` ·
`native mobile app` · `admin configuration or admin surface` · `search` ·
`reporting` · `audit logging` · `email or notification delivery` ·
`data retention or export` · `migration tooling` · `error monitoring
(Sentry-class)` · `rate limiting outside chat`

**Integrations is the one exception** — exactly one exists: **TMDB** for movie
metadata (`server/features/metadata/metadata-tmdb.ts:14`), key-gated. Any
integration impact analysis is limited to TMDB.

Consequences worth stating: **there is no way to measure whether a shipped feature
worked.** A success signal must therefore be a *falsifiable observable*, and any
requirement to measure it must be stated as new instrumentation the feature needs —
never as a baseline or target number, which would be fabricated.

## Technical constraints

- Room code: 5 chars from `abcdefghjkmnpqrstuvwxyz23456789` — ambiguous
  `0/1/i/l/o` excluded (`server/entities/room-store/room-code.ts:1`).
- Capacity: `maxRoomSize` config, ~15 (`server/app/server.ts:39`).
- Chat: 500 chars, 5 messages / 2000 ms.
- Reactions: fixed 5-emoji allowlist, server-rejected otherwise.
- Topology: **star** — host holds one `SimplePeer` per viewer.
- Media capture depends on `HTMLVideoElement.captureStream` / `mozCaptureStream`,
  and **audio tracks only populate while the element is actively playing**
  (`app/widgets/player-shell/logic/use-peer-media-stream.ts:42`).
- TLS is dev-only self-signed behind `DEV_HTTPS`; production assumes a
  terminating proxy.
- State: Zustand for realtime state, React Context for app/session state.

## Known structural limitations

- Synchronized playback and control delegation are unwired (above).
- Authorization is client-side only for everything except room lock and
  termination.
- Two parallel UI kits: `app/shared/ui-kit` (~50 importers, canonical) and
  `app/common/components` (5 components, only legacy/dead consumers).
- ~13 confirmed dead files: `app/pages/**` (5), route-colocated legacy logic (3),
  plus the legacy `webRTC`/`webSocket`/`videoPlayback` feature directories.
- `.github/workflows/ci.yml` typechecks `server.js`, a path that does not exist —
  so `server/` has effectively never been typechecked in CI.
- `ERD.md` does not exist yet; no entity invariants are documented or test-bound.
- Every enforcement mechanism in `docs/GOVERNANCE.md` is still `[planned]` except
  plain `deno fmt` / `lint` / `check` / `test`.

## Keeping this document honest

This model is **as-built**, so it goes stale the moment behaviour changes. Rules:

- Any pipeline stage that finds this document contradicting the code must **stop
  and report the contradiction**, naming the `file:line` that disproves it. It may
  not silently work around a stale model, and it may not edit this file
  unilaterally — a consumer that rewrites its own reference material is grading its
  own homework.
- A wiring status changing from `UNWIRED` or `CONTRACT-ONLY` to `LIVE` is the most
  common update and the most important: it is what stops a completed capability
  from being proposed twice.
- Terminology changes require a `docs/DECISIONS.md` entry, because a vocabulary
  change invalidates the ratchet baseline.
