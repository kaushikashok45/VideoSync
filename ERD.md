# ERD.md — entities, invariants, and the tests that prove them

The domain model of The Sync Party. **Machine-checked by
`deno task erd:check`**, which parses the `INV` / `Proven by:` structure,
resolves every reference to a real `Deno.test("<literal>"` in the named file,
and fails on a missing file, a missing test name, a non-literal test name, an
entity with zero invariants, or any directory under `app/entities` or
`server/entities` absent from this document.

`erd:check` proves a binding **exists**. It cannot prove the test _proves_ the
invariant — that gap belongs to `reviewer-contracts-tests`, and
`docs/GOVERNANCE.md` assigns it there.

## Format contract

- Invariant ids are `<ENTITY>-INV-<n>`, numbered from 1, **never renumbered** —
  holes are legal, because a downstream reference to a deleted id must break
  loudly rather than silently point at a different invariant.
- `Proven by:` names a file and a **string-literal** test name. `erd:check`
  fails loudly on a template literal, an object form, or a variable — a checker
  that cannot see a test must not report success.
- `Proven by: PENDING — <reason>` marks an invariant that is **true of the
  design but not yet proven**. These are counted and **ratcheted: the count may
  only decrease.** An invariant with no test is visible debt rather than a
  silent gap, which is the same discipline the lint baseline uses.
- **`erd:check` must parse structure, not grep text.** Invariants are numbered
  list items under an entity's `**Invariants**` heading; this format-contract
  section documents the `PENDING` syntax and therefore _contains_ the literal
  string. A grep-based checker would count this line as a ninth pending
  invariant and would break the moment the format is documented at all. Parse
  the entity sections.
- Wire payloads in `shared/contracts/` are cross-referenced as _derived from_
  the entity they serialize. This document says which payload maps to which
  entity; it never restates a shape.

---

## Entity: Room

- **Owner**: `server/entities/room-store` (authoritative). Mirrored read-only in
  `app/entities/room`. **The typed `Room` exemplar**
  (`docs/DECISIONS.md#ad-012`, `#ad-013`): every field `readonly` and
  runtime-frozen, every mutation a pure transition function returning a new
  `Room` or throwing `AppError`, and `code` a branded `RoomCode` produced only
  by `parseRoomCode` at the one parse boundary -- the parse-don't-validate case
  the rest of the codebase is migrating toward.
- **Identity**: `code` — 5 characters from `abcdefghjkmnpqrstuvwxyz23456789`,
  excluding the visually ambiguous `0 1 i l o`.
- **Serialized as**: `RoomMeta` (`shared/contracts/room-meta.ts`).

| Attribute  | Meaning                                         |
| ---------- | ----------------------------------------------- |
| `code`     | identity; the thing a user shares               |
| `hostId`   | the socket id that owns the room's life         |
| `members`  | `Map<memberId, Member>`                         |
| `locked`   | whether new viewers may join                    |
| `capacity` | maximum members, from server config (~15)       |
| `source`   | the optional `MediaSource` everyone is watching |
| `metadata` | optional `MovieMetadata` from TMDB              |

**Relationships**

- `Room 1 —— 1..N Member` — **composition.** Members do not exist outside a
  room; when the room is deleted they are gone with it.
- `Room 1 —— 0..1 MediaSource` — aggregation, replaceable.
- `Room 1 —— 0..1 Playback` — composition; playback is meaningless without a
  room.

**Lifecycle**: `open → locked → ended`

`locked` is reversible (`locked → open`). **`ended` is terminal — there is no
resurrection.** A room's death is caused by its host disconnecting, and is the
single most consequential transition in the product (`PD-002`).

**Invariants**

1. `ROOM-INV-1`: member count never exceeds capacity, checked at the exact
   boundary. Proven by: `server/entities/room-store/room-store.test.ts` ::
   `"addMember enforces the exact capacity boundary"`
2. `ROOM-INV-2`: a locked room admits no new viewer; the host is still admitted.
   Proven by: `server/entities/room-store/room-store.test.ts` ::
   `"addMember rejects joining a locked room as a viewer, allows host"`
3. `ROOM-INV-3`: adding an existing member id is idempotent — it never
   duplicates a member or inflates the count. Proven by:
   `server/entities/room-store/room-store.test.ts` ::
   `"addMember is idempotent for an existing member id"`
4. `ROOM-INV-4`: every room is created host-owned, with a valid code. Proven by:
   `server/entities/room-store/room-store.test.ts` ::
   `"create stores a host-owned room and assigns a valid code"`
5. `ROOM-INV-5`: a room cannot be created without a non-empty host name. Proven
   by: `server/entities/room-store/room-store.test.ts` ::
   `"create rejects an empty or whitespace host name"`
6. `ROOM-INV-6`: a code is never issued containing an ambiguous character.
   Proven by: `server/entities/room-store/room-code.test.ts` ::
   `"generateRoomCode avoids ambiguous characters"`
7. `ROOM-INV-7`: a malformed, wrong-length, or ambiguous code is rejected rather
   than looked up. Proven by: `server/entities/room-store/room-code.test.ts` ::
   `"isValidRoomCode rejects malformed, wrong-length, and ambiguous codes"`
8. `ROOM-INV-8`: an unknown or malformed code resolves to nothing — never to
   another room. Proven by: `server/entities/room-store/room-store.test.ts` ::
   `"get returns undefined for unknown or malformed codes"`
9. `ROOM-INV-9`: deleting a room removes it entirely, leaving no reachable
   remnant. Proven by: `server/entities/room-store/room-store.test.ts` ::
   `"delete removes the room entirely"`
10. `ROOM-INV-10`: `ended` is terminal — a room that has ended can never accept
    a member or be re-opened. Proven by:
    `server/features/room/room-handler.test.ts` ::
    `"a room that has ended accepts no new member and cannot be re-opened"`
11. `ROOM-INV-11`: **no operation may read or mutate a room other than the one
    the acting socket belongs to** (`ARCH-004`). Proven by:
    `server/features/room/room-handler.test.ts` ::
    `"a member joining one room reaches no member of another room"` Also proven
    by: `"a member leaving one room reaches no member of another room"` and
    `"a room ending on host disconnect reaches no member of another room and leaves it running"`
    (same file). Signalling isolation is covered by `SIGNAL-INV-1`..`3`.

---

## Entity: Member

- **Owner**: `server/entities/member` (authority for role and control). Mirrored
  in `app/entities/member`.
- **Identity**: `id` — **the socket id**. Ephemeral by construction: a member
  has no identity that survives a disconnect (`PD-003`).
- **Serialized as**: `Member` (`shared/contracts/member.ts`).

| Attribute    | Meaning                                               |
| ------------ | ----------------------------------------------------- |
| `id`         | socket id; identity and connection are the same thing |
| `name`       | display name, client-supplied                         |
| `role`       | `"host" \| "viewer"`                                  |
| `canControl` | whether a viewer has been granted playback control    |

**Relationships**

- `Member N —— 1 Room` — every member belongs to exactly one room.
- `Member 1 —— 0..N Peer` — a member may hold many WebRTC peer connections.
  **`peer` is not a synonym for `member`** (`docs/PRODUCT-MODEL.md`).

**Lifecycle**: `joined → (granted ⇄ revoked) → left`

`left` is terminal for that id. Reconnecting produces a **different** member,
because the identity is the socket.

**Invariants**

1. `MEMBER-INV-1`: a host can always control the room. Proven by:
   `server/entities/member/permissions.test.ts` ::
   `"host can always control the room"`
2. `MEMBER-INV-2`: a viewer controls the room only when explicitly granted.
   Proven by: `server/entities/member/permissions.test.ts` ::
   `"viewer with canControl flag can control the room; plain viewer cannot"`
3. `MEMBER-INV-3`: control cannot be revoked from a host, and revocation is
   host-only. Proven by: `server/entities/member/permissions.test.ts` ::
   `"revokeControl is host-only and cannot revoke a host"`
4. `MEMBER-INV-4`: granting control requires a grantor — control cannot be
   self-assigned. Proven by: `server/entities/member/permissions.test.ts` ::
   `"grantControl flips the target flag and requires a grantor"`
5. `MEMBER-INV-5`: grant then revoke returns the member to exactly its prior
   state. Proven by: `server/entities/member/permissions.test.ts` ::
   `"repeated grant then revoke returns to not-controlling"`
6. `MEMBER-INV-6`: removing a member returns it; removing an unknown id is a
   no-op. Proven by: `server/entities/room-store/room-store.test.ts` ::
   `"removeMember removes and returns the member; unknown id returns undefined"`
7. `MEMBER-INV-7`: **a member's claimed role or `canControl` is never trusted
   from the client** (`ARCH-005`). Proven by:
   `server/features/room/room-handler.test.ts` ::
   `"a client-asserted role or canControl in the join payload is not trusted by the server"`

> **`MEMBER-INV-4`, `MEMBER-INV-5`, and `MEMBER-INV-7` describe a capability
> that is `UNWIRED`.** `permissions.ts` has zero callers outside its own test
> (`OPEN-2`). The rules are proven; the system does not yet invoke them.

---

## Entity: Playback

- **Owner**: the **host** is authoritative for playback truth. State math lives
  in `server/entities/playback`; mirrored in `app/entities/playback`.
- **Identity**: none — exactly one playback state per room.
- **Serialized as**: `PlaybackSnapshot` (`shared/contracts/playback.ts`).
  Commands are carried by `DATA_CHANNEL_MESSAGES`
  (`shared/contracts/data-channel-messages.ts`).

| Attribute         | Meaning                                                         |
| ----------------- | --------------------------------------------------------------- |
| `status`          | `"playing" \| "paused" \| "ended"`                              |
| `positionSeconds` | the baseline position                                           |
| `updatedAtMs`     | when the baseline was set, so position can be projected forward |
| `rate`            | playback rate                                                   |
| `durationSeconds` | the media's length                                              |

Note the deliberate two-vocabulary split: playback **actions** are
`play/pause/seek/forward/rewind`; playback **status** is `playing/paused/ended`.
These are different concepts and `terminology:check` protects the distinction.

**Lifecycle**: `paused ⇄ playing → ended`

**Invariants**

1. `PLAYBACK-INV-1`: a paused state does not advance with wall-clock time.
   Proven by: `server/entities/playback/playback-state.test.ts` ::
   `"paused state does not advance over time"`
2. `PLAYBACK-INV-2`: a playing state projects position forward at its rate.
   Proven by: `server/entities/playback/playback-state.test.ts` ::
   `"playing state projects currentTime forward at rate"`
3. `PLAYBACK-INV-3`: pausing freezes at the projected position — never at the
   stale baseline. Proven by: `server/entities/playback/playback-state.test.ts`
   :: `"pause freezes at the projected time"`
4. `PLAYBACK-INV-4`: position is always clamped to `[0, duration]`. Proven by:
   `server/entities/playback/playback-state.test.ts` ::
   `"seek clamps to duration and zero bounds"`
5. `PLAYBACK-INV-5`: `ended` accepts no play — it is terminal for that media.
   Proven by: `server/entities/playback/playback-state.test.ts` ::
   `"play is a no-op when ended"`
6. `PLAYBACK-INV-6`: playing again while already playing never rewinds or
   re-baselines. Proven by: `server/entities/playback/playback-state.test.ts` ::
   `"play on an already-playing state does not rewind or rebaseline"`
7. `PLAYBACK-INV-7`: stepping forward or rewinding respects both bounds. Proven
   by: `server/entities/playback/playback-state.test.ts` ::
   `"forward/rewind respect the duration and zero bounds"`
8. `PLAYBACK-INV-8`: drift is reported as a **signed** difference, so direction
   is recoverable. Proven by: `server/entities/playback/playback-state.test.ts`
   :: `"drift detection reports signed difference"`
9. `PLAYBACK-INV-9`: drift acceptability is evaluated at the exact threshold.
   Proven by: `server/entities/playback/playback-state.test.ts` ::
   `"drift acceptability respects the exact threshold"`
10. `PLAYBACK-INV-10`: reducing duration re-caps a projection that would exceed
    it. Proven by: `server/entities/playback/playback-state.test.ts` ::
    `"setDuration caps projection at the new duration"`
11. `PLAYBACK-INV-11`: **every member converges on the host's playback state**.
    Proven by: PENDING — **this is the product's defining behaviour and it is
    not wired** (`OPEN-1`). The state math above is complete and proven; no
    transport carries it between members, so convergence cannot currently be
    tested at all. Needs the multi-client E2E harness (`AD-001`).
12. `PLAYBACK-INV-12`: a member joining mid-playback adopts the host's current
    projected position, not the baseline. Proven by: PENDING — depends on
    `PLAYBACK-INV-11`.
13. `PLAYBACK-INV-13`: a viewer's local state is never canonical for shared
    playback (`ARCH-006`). Proven by: PENDING — no authority is currently
    enforced because no state is exchanged.

---

## Entity: Chat

- **Owner**: `server/features/chat` (validation and rate limiting are
  server-authoritative). Mirrored in `app/entities/chat`.
- **Identity**: `id` — a nanoid.
- **Serialized as**: `ChatMessage` (`shared/contracts/chat-message.ts`).

| Attribute  | Meaning                        |
| ---------- | ------------------------------ |
| `id`       | message identity               |
| `senderId` | the member id that sent it     |
| `text`     | body, capped at 500 characters |
| `ts`       | send timestamp                 |

**Relationships**: `Chat N —— 1 Room` (composition — messages die with the room,
since nothing persists). `Chat N —— 1 Member` by `senderId`.

**Lifecycle**: `sent → delivered`. There is no edit, delete, or read state.

**Invariants**

1. `CHAT-INV-1`: a message longer than the 500-character cap is rejected with a
   typed error, not silently truncated. Proven by:
   `server/features/chat/chat-handler.test.ts` ::
   `"oversized chat message is rejected with a typed error"`
2. `CHAT-INV-2`: a sender exceeding 5 messages per 2000 ms is rejected beyond
   the window budget. Proven by: `server/features/chat/chat-handler.test.ts` ::
   `"chat rate limiter allows the window budget and rejects beyond"`
3. `CHAT-INV-3`: an empty message is never relayed. Proven by:
   `server/features/chat/chat-handler.test.ts` ::
   `"empty chat message is ignored"`
4. `CHAT-INV-4`: **a non-member cannot send into a room** — a message from a
   socket that has not joined is dropped (`ARCH-005`). Proven by:
   `server/features/chat/chat-handler.test.ts` ::
   `"chat before joining is dropped"`
5. `CHAT-INV-5`: a relayed message reaches the sender's room, carrying sender
   metadata. Proven by: `server/features/chat/chat-handler.test.ts` ::
   `"chat message is relayed to the room with sender metadata"`
6. `CHAT-INV-6`: a message reaches **no member outside** the sender's room
   (`ARCH-004`). Proven by: `server/features/chat/chat-handler.test.ts` ::
   `"chat in one room reaches no member of another room"`

> The gap between `CHAT-INV-5` and `CHAT-INV-6` is the distinction this document
> exists to make precise. "Relayed to the room" is a positive claim; "reaches no
> other room" is a negative one, and only the negative is an isolation
> guarantee. A single missing room scope on an emit satisfies the first test and
> violates the second.

## Entity: Reaction

- **Owner**: `server/features/reactions`. Mirrored in `app/entities/reaction`.
- **Identity**: none — keyed by `senderId` + `ts`. Reactions are ephemeral and
  not addressable.
- **Serialized as**: `Reaction` (`shared/contracts/reaction.ts`); the allowlist
  is `shared/contracts/reaction-emojis.ts`.

| Attribute  | Meaning                        |
| ---------- | ------------------------------ |
| `senderId` | the member id that reacted     |
| `emoji`    | one of exactly 5 allowed emoji |
| `ts`       | when it happened               |

**Relationships**: `Reaction N —— 1 Room` (composition).
`Reaction N —— 1 Member`.

**Lifecycle**: `sent → displayed → expired`. Nothing is retained.

**Invariants**

1. `REACTION-INV-1`: only an emoji on the 5-item allowlist is relayed; anything
   else is ignored server-side. Proven by:
   `server/features/reactions/reaction-handler.test.ts` ::
   `"disallowed emoji is ignored"`
2. `REACTION-INV-2`: a reaction with no emoji is ignored rather than relayed as
   empty. Proven by: `server/features/reactions/reaction-handler.test.ts` ::
   `"missing emoji is ignored"`
3. `REACTION-INV-3`: **a non-member cannot react into a room** (`ARCH-005`).
   Proven by: `server/features/reactions/reaction-handler.test.ts` ::
   `"reaction before joining is dropped"`
4. `REACTION-INV-4`: a relayed reaction reaches the sender's room. Proven by:
   `server/features/reactions/reaction-handler.test.ts` ::
   `"reaction is relayed to the room"`
5. `REACTION-INV-5`: a reaction reaches **no member outside** the sender's room
   (`ARCH-004`). Proven by: `server/features/reactions/reaction-handler.test.ts`
   :: `"reaction in one room reaches no member of another room"`

---

## Entity: Signal (WebRTC signalling relay)

- **Owner**: `server/features/signaling`. Not a persisted entity — a transient
  relay — but it carries an isolation guarantee, so it belongs in this document.
- **Identity**: none. A signal is addressed by `to` (a target socket id) or
  broadcast to the sender's room.
- **Serialized as**: `SignalPayload` and `RelaySignalPayload`
  (`shared/contracts/payloads/`).

**Invariants**

1. `SIGNAL-INV-1`: a **targeted** signal reaches no member outside the sender's
   room (`ARCH-004`). Proven by:
   `server/features/signaling/signaling-handler.test.ts` ::
   `"a targeted signal from a member of one room reaches no member of another room"`
   Refusal is typed, proven by:
   `"a refused cross-room signal emits ROOM_PERMISSION_DENIED to the sender"`
2. `SIGNAL-INV-2`: an **untargeted** signal reaches no member outside the
   sender's room. Proven by:
   `server/features/signaling/signaling-handler.test.ts` ::
   `"an untargeted signal from one room reaches no member of another room"`

3. `SIGNAL-INV-3`: a socket belonging to no room may not target anyone. Proven
   by: `server/features/signaling/signaling-handler.test.ts` ::
   `"a targeted signal from a socket in no room is refused with a typed error"`

> Both branches now resolve the room **server-side**. The defect (`OPEN-4`,
> fixed 2026-08-19 as `AD-002`) was that the targeted branch trusted a
> client-supplied `to` while the untargeted branch three lines below it derived
> the room correctly — the safe pattern sat beside the unsafe one, which is why
> review missed it.

## Pending invariants — the tracked gap

`erd:check` counts these and **the count may only decrease**. They are the
honest ledger of what this domain model asserts but does not yet prove.

| Invariant         | Why unproven                                      | Blocked on                  |
| ----------------- | ------------------------------------------------- | --------------------------- |
| `PLAYBACK-INV-11` | **the product's defining behaviour is unwired**   | `OPEN-1` + `AD-001` harness |
| `PLAYBACK-INV-12` | depends on `PLAYBACK-INV-11`                      | as above                    |
| `PLAYBACK-INV-13` | no authority exists because no state is exchanged | as above                    |

**Pending count: 3.** This number may only decrease. Was 8; five were closed by
the two-room isolation tests, and the sixth turned out to be a genuine defect
(`OPEN-4`, fixed as `AD-002`) rather than a missing test. The remaining three
are `PLAYBACK-INV-11`..`13`, all blocked on the unwired sync transport
(`OPEN-1`).

**One of these deserves to be read as a finding, not bookkeeping:**

- **`PLAYBACK-INV-11`** — the capability the product is named for is unproven
  because it is unwired. The state math is complete and thoroughly tested; only
  the transport is missing.
