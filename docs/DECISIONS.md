# DECISIONS.md — product decision log

**Durable, committed, append-only.** Supersede an entry; never rewrite or delete
one. This is the answer to "why don't we do X?" months later, and its value is
entirely in being trustworthy about the past.

Not to be confused with the root `DECISION.md`, which is **scratch** design-doc
material for whatever change is currently in flight and is deleted before every
commit. Product decisions live **here** or they do not survive. Entries are
numbered `PD-<n>` to keep the two unambiguous while both exist.

## How entries are written

A pipeline stage **proposes** entries; a human **confirms** them at an approval
gate. An agent never appends unilaterally — a log partly authored by the agent
that consumes it has no authority as "what we decided".

**Two prefixes, one log.** `PD-<n>` is a **product** decision; `AD-<n>` is an
**architectural** one. They share this file because the reason an architectural
decision exists is almost always a product decision — most architectural constraints
here descend from `PD-003`'s unauthenticated identity — and answering "why is it like
this?" should mean reading one file, not two.

An `AD-<n>` entry additionally carries **trade-offs** and **reversibility**
(`EASY` / `MODERATE` / `EXPENSIVE` / `NEAR-IRREVERSIBLE`), because an
architectural decision's cost is mostly the cost of undoing it.

Every entry carries: what was decided, why, alternatives rejected, constraints
that forced it, consequences, and the date. Consequences are the field people skip
and the field that pays off later.

**Before proposing anything that contradicts an entry here, say so explicitly and
name the id.** A contradiction is a decision to reopen, which is fine — silently
reversing a recorded decision is not.

---

## PD-001 — Keep P2P WebRTC via `simple-peer`; no SFU

- **Decided**: pre-2026-08-08 · recorded in `docs/specs/2026-08-08-sync-party-v2-prd.md:24,49`
- **Why**: keeps infrastructure cost near zero and avoids operating a media server
  for a product sized at ~15 viewers per room.
- **Alternatives rejected**: LiveKit or another SFU — rejected as disproportionate
  operational burden at this scale.
- **Consequences**: topology is a **star**, with the host holding one peer
  connection per viewer. Host upstream bandwidth is the binding capacity
  constraint, which is what fixes the ~15-viewer ceiling. Viewer↔viewer media is
  impossible by construction.

## PD-002 — Rooms are ephemeral, in-memory, host-owned, and end on host disconnect

- **Decided**: pre-2026-08-08 · `docs/specs/2026-08-08-sync-party-v2-prd.md:19-36`
- **Why**: no database, no accounts, no retention obligations, nothing to migrate.
- **Alternatives rejected**: persistent rooms with history and favourites —
  rejected for v1 as scope that forces identity and storage.
- **Consequences**: no room history, no rejoin after the host leaves, no analytics
  possible on past rooms. Any feature assuming a room outlives a connection
  contradicts this entry.

## PD-003 — No user accounts or authentication in v1; a member is a socket id

- **Decided**: pre-2026-08-08 · `docs/specs/2026-08-08-sync-party-v2-prd.md:47`
- **Why**: the product is a link-shared, ephemeral watch session; accounts would
  add friction to the only journey that matters.
- **Consequences**: identity is unauthenticated and non-persistent, so **any
  authorization is advisory**. A modified client can assert whatever role it likes
  for anything the server does not independently check. Any feature requiring
  trustworthy identity or per-user permissions contradicts this entry and needs it
  reopened first.

## PD-004 — Host→viewer media only; no viewer↔viewer streams

- **Decided**: pre-2026-08-08 · `docs/specs/2026-08-08-sync-party-v2-prd.md:50`
- **Why**: follows from PD-001's star topology; viewer↔viewer would require a mesh
  and multiply connection count.
- **Consequences**: no viewer voice or video chat. Social presence is text chat and
  reactions only.

## PD-005 — Client state splits: Zustand for realtime, React Context for app/session

- **Decided**: pre-2026-08-08 · `docs/specs/2026-08-08-sync-party-v2-prd.md:19-36`
- **Why**: realtime state changes at a frequency that would thrash context
  consumers; session identity changes almost never.
- **Consequences**: two state mechanisms coexist legitimately. `session` therefore
  names a **client-local identity context**, distinct from `room` — the terminology
  ontology in `docs/PRODUCT-MODEL.md` protects that distinction.

## PD-006 — Legacy `components/` shares the presentation complexity budget with `ui/`

- **Decided**: 2026-08-19 · `docs/GOVERNANCE.md` (threshold-selection section)
- **Why**: keying the looser presentation bound only on `ui/` would give legacy JSX
  the *stricter* logic bound. Moving a file into `ui/` would then simultaneously
  loosen its complexity budget and trip new-path zero-tolerance — making migration
  strictly harder than standing still.
- **Alternatives rejected**: `ui/`-only keying, for the incentive inversion above.
- **Consequences**: presentation is presentation regardless of directory name.
  Migration is never punished by the checker.

## PD-007 — `tools/**` is exempt from boundary and dumb-UI checks and gets the presentation complexity bound

- **Decided**: 2026-08-19 · `docs/GOVERNANCE.md` (`tools/**` carve-out)
- **Why**: graph algorithms (Tarjan's SCC) and CLI argument handling are
  irreducibly branchy, encode no domain invariant, and forcing them through
  single-decision functions produces worse code than it prevents. `tools/**` is
  also not FSD, so boundary rules have nothing to say about it.
- **Alternatives rejected**: pretending the governance tooling obeys a rule it
  cannot; exempting it silently.
- **Consequences**: a stated carve-out with a rationale rather than an unexamined
  exception. The bound still applies — the exemption is narrow.

## PD-008 — Audio capture is bound to the `playing` event, and captured once

- **Decided**: pre-2026-08-19 · `app/widgets/player-shell/logic/use-peer-media-stream.ts:42-46`
- **Why**: `captureStream` only produces audio frames while the element is actively
  playing, so capturing on paused metadata yields a video-only stream. Capturing
  once keeps the stream stable so repeated `playing` events never add duplicate
  tracks.
- **Consequences**: a viewer joining while the host is paused cannot receive audio
  until playback starts. Any feature involving pre-play audio contradicts this
  constraint.

## PD-009 — The `Reciever` misspelling is frozen, not renamed

- **Decided**: pre-2026-08-19 · `AGENTS.md:142-145,330-331`
- **Why**: the misspelling is baked into a **live route** (`/:id/RecieverVideoPlayerNew`)
  and a component name across 8 files. Renaming changes a URL users may have
  shared.
- **Alternatives rejected**: a drive-by rename — explicitly forbidden by
  `AGENTS.md`, since it mixes an unrelated rename into every feature branch that
  touches those files.
- **Consequences**: `terminology:check` grandfathers existing occurrences and fails
  any **new** one. The correct spelling is mandatory in new code, producing a
  deliberate, documented inconsistency rather than an accidental one.

---

## AD-001 — Build a real browser E2E harness for multi-client flows

- **Decided**: 2026-08-19 · proposed during pipeline design, human-confirmed
- **Context**: this product's defining behaviour is **multi-user** — two or more
  members in one room, synchronising playback. Unit and integration tests cannot
  reach it: there is no single process whose behaviour is the product. The existing
  `deno task smoke` is a shell script that checks the server boots.
- **Decision**: build a browser-driven E2E harness capable of running **two or more
  client contexts against one server**, and cover the multi-client flows with it.
- **Options rejected**:
  - *Extend the smoke script only* — cannot drive two clients, so the core behaviour
    stays unverified.
  - *No E2E layer* — leaves the product's whole point with no end-to-end coverage,
    and the mutation harness cannot substitute: mutation testing proves tests are
    sensitive, not that the tests exercise real multi-client behaviour.
- **Trade-offs**: a real new piece of infrastructure and a new dependency. Consistent
  with the existing toolchain, which already consumes everything through `npm:`
  specifiers — so this does not breach the Deno-native rule, but it is the largest
  new dependency in the project.
- **Consequences**: E2E becomes a required test layer for any feature touching
  multi-member behaviour. CI runtime grows. The harness itself is `tools/`-adjacent
  infrastructure and must be built and tested like the rest of the tooling.
- **Reversibility**: `MODERATE` — the harness can be removed, but tests written
  against it would need rewriting or deleting.

---

## AD-002 — Signalling requires shared room membership, refused with a typed error

- **Decided**: 2026-08-19 · fixes the defect previously recorded as `OPEN-4`
- **Context**: `signaling-handler.ts` forwarded a **client-supplied** `payload.to` straight
  to `io.to(payload.to).emit(...)`. socket.io auto-joins every socket to a room named after
  its own id, so `io.to(<socketId>)` addresses that socket **anywhere on the server** — any
  client could inject WebRTC signalling into any room. Violated `ARCH-004` (room isolation)
  and `ARCH-005` (client input trusted unverified).
- **Decision**: both the sender's and the target's room are resolved from **server-side
  state**; a relay proceeds only when they match. Otherwise it is refused and the sender
  receives a typed `AppError`. A socket in no room may not target anyone.
- **Why `ROOM_PERMISSION_DENIED` rather than a new code**: `shared/contracts/` is the
  contract between two independently deployed halves and carries **no protocol version**
  (`ARCH-009`). A new `ErrorCode` would reach clients that have never heard of it, forcing a
  coordinated deploy. Reusing an existing code keeps this security fix **additive-only** on
  the wire.
- **Options rejected**:
  - *Drop silently* — the sender cannot distinguish refusal from a lost packet, and a silent
    security refusal is undiagnosable in the field.
  - *Allow roomless sockets to signal each other* — treating "both in no room" as a shared
    room lets a socket that never joined signal any other unjoined socket, and is
    inconsistent with chat and reactions, which already drop pre-join actions.
- **Trade-offs**: signalling now depends on join ordering. A client signalling before its
  join completes is refused rather than queued — correct, but it makes join sequencing a
  real precondition rather than an incidental one.
- **Consequences**:
  - A pre-existing test, `"signal relays to a targeted socket with sender peerId"`, used two
    **roomless** sockets and passed. It **pinned pre-isolation behaviour as a requirement**,
    and is why the leak survived review. Rewritten to place both sockets in one room.
  - Refusals log at **error** level: a cross-room signal attempt is not routine behaviour.
  - `SIGNAL-INV-1`..`3` in `ERD.md` now bind to passing tests.
- **Reversibility**: `EASY` — four small private methods in one handler.

---

## AD-003 — The lint plugins own baseline suppression, not the `check:*` tasks

- **Decided**: 2026-08-19 · Phase 2 design, migrated from the Phase 2 scratch log
- **Context**: the ratchet needs somewhere to apply itself. The obvious split is
  "plugin reports everything, task filters to the baseline" — which makes a plain
  `deno lint` permanently red on the ~40 known-bad files and every slice missing
  an `index.ts`.
- **Decision**: each lint plugin loads `tools/baseline/baseline.json` once at
  construction and **suppresses** violations whose identity is in the baseline. A
  clean `deno lint` therefore means "compliant with the ratchet", not "compliant
  with the ideal". The `check:*` tasks do **not** filter diagnostics.
- **Options rejected**:
  - *Task-side filtering* — leaves `deno lint` permanently red. A permanently-red
    linter trains agents and humans to ignore linter output, which is the exact
    failure mode this system exists to prevent. Enforcement must be
    green-when-good or it is theatre.
  - *`// deno-lint-ignore` comments in legacy files* — pollutes ~40 files with
    suppressions that no longer carry the violation's identity, cannot express
    "count may only decrease", and are trivially copied into new code.
- **Trade-offs**: the baseline becomes a load-time input to the linter, so a
  corrupt or missing baseline must have defined behaviour — see AD-008. Enabled by
  Deno 2.9 exposing the full `Deno` API inside a rule's `create()`, so
  `Deno.readTextFileSync` at load is legal; verified live, not assumed.
- **Consequences**: `deno lint` and `deno task check:*` can never disagree about
  *what* is a violation, only about *which files* are in scope. Editor lint
  integration reflects the ratchet automatically with no extra wiring.
- **Reversibility**: `MODERATE` — moving suppression to the tasks later would
  reintroduce the red-linter problem it was chosen to avoid.

---

## AD-004 — One path-classification primitive; no plugin re-derives path semantics

- **Decided**: 2026-08-19 · Phase 2 design, migrated from the Phase 2 scratch log
- **Context**: threshold selection, the `tools/**` carve-out, the legacy zone, the
  dumb-UI activation set, and the `no-dumping-ground` exemptions are all
  restatements of one question: what is this file, structurally?
- **Decision**: `tools/lint-plugins/shared/fsd-path.ts` exports a single pure
  function mapping an absolute path to a classification record — which root
  (`app` | `server` | `contracts` | `tools` | `legacy` | `outside`), the numeric FSD
  layer, the slice name if any, and the slice-internal role (`ui` | `model` | `api`
  | `lib` | `contracts` | `index` | `test` | `other`). All plugins consume it; no
  plugin inspects a path string itself.
- **Options rejected**: *per-plugin path checks* — answered in four places it
  drifts in four directions, and the drift is **silent**: a file treated as
  presentation by one plugin and logic by another produces contradictory
  diagnostics with no error to signal the contradiction.
- **Trade-offs**: one module becomes load-bearing for every rule's correctness.
- **Consequences**: the carve-outs stop being scattered `if
  (path.includes("tools/"))` checks and become one classification result, which is
  what makes them auditable at all. `fsd-path.ts` is the highest-leverage
  unit-test target in Phase 2 — pure, total, and every rule's correctness is
  downstream of it.
- **Reversibility**: `LOW` — every rule depends on its record shape.

---

## AD-005 — Violation identity is shared code, used by both the suppressor and the generator

- **Decided**: 2026-08-19 · Phase 2 design, migrated from the Phase 2 scratch log
- **Context**: the ratchet identifies a violation by content, never by
  `file+line`, so that an edit above a violation cannot appear to fix it.
- **Decision**: the identity hash — `sha256(ruleId + enclosing function name +
  param count + hash of the first 3 non-blank body statements)` — lives in one
  module, `tools/baseline/identity.ts`, imported by **both** the plugins (which
  compute it to suppress) and `baseline.ts` (which computes it to write).
- **Options rejected**: *separate implementations for reading and writing* — two
  implementations of one hash is a bug class with **no failure signal**. The
  baseline silently stops matching, every legacy violation reappears, and the only
  symptom is a linter that was green yesterday. One implementation makes
  disagreement impossible rather than unlikely.
- **Trade-offs**: identity inputs are constrained to what a lint rule can see from
  the AST alone — no type information, no file mtime, and deliberately no line
  numbers.
- **Consequences**: renaming a function changes its violations' identities, so
  they read as new. That is intended: the new-path zero-tolerance rule makes
  splitting or moving a file **stricter** rather than looser.
- **Reversibility**: `LOW` — changing the hash invalidates every baseline entry.

---

## AD-006 — `specifier-resolve.ts` is shared by the boundary plugin and the graph builder

- **Decided**: 2026-08-19 · Phase 2 design, migrated from the Phase 2 scratch log
- **Context**: both the boundary checker and the cycle detector must turn a raw
  import specifier into an absolute path.
- **Decision**: that resolution — alias table read from `deno.json` at load and
  never hardcoded, `sloppyImports` extension inference, directory-index
  inference — lives in one module used by both `boundary-plugin.ts` and
  `tools/graph/build-graph.ts`.
- **Options rejected**:
  - *Independent resolution in each* — if the two disagree, the boundary checker
    and the cycle detector describe **different graphs**, and a cycle can be
    reported through an edge the boundary checker believes does not exist.
    Unfalsifiable output is worse than no output.
  - *`deno info --json`* — unusable here: forward-only, single-root, and it
    resolves aliases away, destroying the raw specifier text the boundary rules
    need to judge a deep import.
- **Trade-offs**: resolution is hand-rolled, so it must be tested against the real
  alias table including the `~/` and `contracts/` cases.
- **Consequences**: dynamic `import()` and re-export barrels are the two known
  holes; left open they produce phantom mutation survivors, so Phase 4 depends on
  closing them.
- **Reversibility**: `MODERATE`.

---

## AD-007 — `check:*` tasks are thin: scope selection and exit code only

- **Decided**: 2026-08-19 · Phase 2 design, migrated from the Phase 2 scratch log
- **Context**: with suppression living in the plugins (AD-003), the tasks need a
  defined and minimal job.
- **Decision**: a `check:*` task does exactly three things — compute the file list
  (`--changed` via the D1 governed diff, or `--all`), invoke `deno lint --json`
  over it, and exit non-zero if any diagnostic carries its plugin's `code` prefix.
  No rule logic, no thresholds, no suppression.
- **Options rejected**: *tasks that apply judgement* — every line of judgement in
  a task is a line `deno lint` does not apply, reintroducing the
  two-sources-of-truth problem AD-003 exists to remove.
- **Trade-offs**: diagnostic filtering is by `code` prefix (`"<plugin>/<rule>"`),
  which `--json` carries — verified live.
- **Consequences**: `deno lint` is the enforcement surface and the tasks are
  ergonomics. Thin tasks also keep the plugins independently testable via
  `Deno.lint.runPlugin`, which only works under `deno test`.
- **Reversibility**: `HIGH`.

---

## AD-008 — A missing or unreadable baseline fails **closed**

- **Decided**: 2026-08-19 · Phase 2 design, migrated from the Phase 2 scratch log
- **Context**: AD-003 makes the baseline a load-time input to the linter, so its
  absence needs defined behaviour.
- **Decision**: if `baseline.json` is absent, malformed, or fails its schema
  check, the plugins suppress **nothing** and every violation is reported. They do
  not treat an empty baseline as "all clear", and they do not crash the lint run.
- **Options rejected**: *fail open* — deleting or corrupting one file would
  disable the entire enforcement system while leaving `deno lint` green. That is
  simultaneously the most likely accident and the easiest deliberate bypass, and
  it is **undetectable by definition**. Fail-closed makes the failure loud: the
  linter goes red everywhere, which is unmistakable.
- **Trade-offs**: between Phase 2 commit 1 and commit 7 the plugins report the
  full unratcheted truth.
- **Consequences**: that window is correct and intentional — it is how the
  baseline gets seeded against the complete rule set, and it is why the plugins
  stay unregistered until commit 7 (AD-010).
- **Reversibility**: `HIGH` to change, but inverting it re-opens a silent bypass.

---

## AD-009 — Per-slice facts are probed once and reported once

- **Decided**: 2026-08-19 · Phase 2 design, migrated from the Phase 2 scratch log
- **Context**: `missing-index`, `missing-contract`, `public-surface-cap`, and
  `slice-fan-out-cap` are properties of a **slice**, but a lint plugin is invoked
  per **file**.
- **Decision**: these rules memoize their filesystem probe per slice for the
  lifetime of the lint run and emit **at most one diagnostic per slice**, anchored
  at the first offending file's `Program` node.
- **Options rejected**: *report per file* — one slice missing an `index.ts` emits
  one identical diagnostic per file in it, roughly 20 for a single defect. That
  buries real findings and inflates the baseline with 20 identities for one fact,
  so fixing the defect appears to fix 20 violations.
- **Trade-offs**: diagnostic anchoring depends on file iteration order, so the
  anchor file may vary between runs.
- **Consequences**: identity therefore keys on the **slice**, not the anchor file
  — otherwise the ratchet entry would churn between runs for no reason.
- **Reversibility**: `MODERATE`.

---

## AD-010 — Plugins stay unregistered in `deno.json` until the baseline is seeded

- **Decided**: 2026-08-19 · Phase 2 design, migrated from the Phase 2 scratch log
- **Context**: the plugins fail closed on a missing baseline (AD-008), which is
  correct but means a registered plugin with no baseline reports every legacy
  violation in the tree.
- **Decision**: commits 2–6 build the four lint plugins but do **not** add them to
  `deno.json` → `lint.plugins`. Registration happens in commit 7, in the same
  commit that seeds `baseline.json`. Until then each plugin is exercised only
  through `Deno.lint.runPlugin` inside its own `deno test`.
- **Options rejected**:
  - *Register as each plugin lands* — `deno lint` goes red, `deno task verify`
    fails, and CI is broken for five consecutive commits. Every one of those
    commits would have to be landed with `--no-verify`, training exactly the
    bypass habit this system exists to prevent.
  - *Seed the baseline in commit 2 and regenerate per commit* — the baseline must
    be seeded once against the complete rule set, or it needs regenerating six
    times and each regeneration is a chance to freeze a violation the next plugin
    would have caught.
  - *Ship the plugins fail-open until commit 7* — inverts AD-008 for a temporary
    convenience, and a fail-open default has a way of surviving to production.
- **Trade-offs**: a plugin is fully tested but not enforcing between its own
  commit and commit 7. That is a deliberate window, not an oversight, and
  `docs/GOVERNANCE.md` marks such rows `[built, unregistered]` rather than `[live]`
  so the document never overstates what is running.
- **Consequences**: commit 7 is the riskiest commit in Phase 2 — it turns on four
  plugins at once. Its verification must confirm `deno lint` is green immediately
  after seeding, not merely that the baseline file parses.
- **Reversibility**: `HIGH`.

---

## AD-011 — Phase 2's own code must be compliant before the baseline is seeded

- **Decided**: 2026-08-19 · Phase 2 design, migrated from the Phase 2 scratch log
- **Context**: the baseline freezes violations by content identity for every path
  present at generation time, and `tools/**` is present.
- **Decision**: commit 7 gains a mandatory pre-step — run every plugin over
  `tools/**` and fix the findings **before** generating `baseline.json`. `tools/**`
  may appear in the baseline's path set but must contribute **zero** violations.
- **Options rejected**:
  - *Exempt `tools/**` from the baseline entirely* — the tooling would be
    permanently ungoverned, and "the checker's own code is exempt" is the least
    defensible exemption in any such system.
  - *Fix it later* — "later" is after the freeze, and after the freeze the
    violation is invisible. Without this rule the ratchet's first act would be to
    forgive the governance code for breaking the rules it exists to enforce.
- **Trade-offs**: it constrains how commits 2–6 may write shared code — types
  shared between `tools/**` modules belong in `tools/contracts/*.d.ts`, not
  co-exported beside a function.
- **Consequences**: concrete on first contact — commit 2's
  `frame-scoped-visitors.ts` exported three symbols and would have failed
  `one-public-export` from commit 5; it was swept before the freeze. Commit 7's
  verification must assert `tools/**` contributes zero baseline entries, not
  merely that the baseline parses.
- **Reversibility**: N/A — a correctness constraint, not a preference.

---

## Open — recorded as unresolved, not decided

These are known contradictions between the product's stated purpose and its
as-built state. They are logged here so a proposal does not have to rediscover
them, and so nobody mistakes silence for a decision.

- **OPEN-1 — Synchronized playback is unwired.** `shared/contracts/data-channel-messages.ts`
  (`sync:state`, `sync:command`, `sync:drift`, `media:ready`) has zero usages, and
  `app/shared/api/sync-engine-client.ts` is pure, tested, and unreached. The
  product's defining capability does not currently function end to end. No decision
  has been recorded about why, or about what the intended transport is.
- **OPEN-2 — Control delegation is unwired across three layers.** Client mutates a
  local store; `server/entities/member/permissions.ts` has zero callers; the
  socket-client emitters have zero call sites; no server handler exists. Whether
  control delegation is still wanted, and whether it can be meaningful given PD-003,
  is undecided.
- **OPEN-3 — Room lock/unlock has no client trigger.** Server logic is complete and
  host-enforced; nothing in `app/` emits the events.
## AD-012 — `Room` becomes immutable; `RoomStore` shrinks to a lookup table

**What.** `Room` (`server/entities/room-store/room.ts`) becomes a frozen,
`readonly`-fielded value. Every current mutation site —
`addMember`/`removeMember`/`lock`/`unlock`/`end` and `room.locked = locked` in
`room-handler.ts` — becomes a **transition function** returning a new `Room`
(or throwing `AppError` for an illegal transition), never mutating the old one
in place. `RoomStore` keeps its `Map<RoomCode, Room>` but every write path
becomes `this.rooms.set(code, nextRoom)` replacing the entry, never
`room.field = x`.

**Why.** This is the plan's own definition of the exemplar: "a factory
enforcing `ROOM-INV-*`, returning a typed value or an `AppError`, ... rather
than holding raw fields." A mutable `Room` with an external manager class
poking its fields is the shape every other entity in this codebase still has —
turning `Room` into the same shape again would produce an exemplar that
exemplifies nothing. Immutability is also what makes `readonly-entity-fields`
meaningful rather than decorative: a `readonly` field on a value nobody mutates
through a back door is a real guarantee, not a lint-only annotation.

**Scope boundary — kept deliberately narrow.** Blast radius outside
`room-store/` and its tests is exactly two files:
`server/features/room/room-handler.ts` (one field mutation,
`room.locked = locked`) and `server/app/server.ts` (construction/DI only,
verified no field access). Nothing under `server/features/signaling/` or
`server/features/chat/` touches `Room` fields directly. This stays true after
the change — if implementation finds a third call site, that is scope creep to
flag, not to absorb silently.

## AD-013 — `RoomCode` is branded now; `hostId`/`Member.id` are not

**What.** Room's identity field gets a real branded type:
`type RoomCode = string & { readonly __brand: "RoomCode" }`, produced only by
`parseRoomCode(raw: string): RoomCode` at the one existing parse boundary
(`isValidRoomCode`'s call sites) — the parse-don't-validate case this project
keeps citing as the goal. `hostId: string` on `Room`, and `Member.id: string`,
are **left unbranded**, on purpose, in this commit.

**Why not brand `hostId` too, since it is a two-minute change?** Because
`hostId` and `Member.id` are the same identity space — a host is a member — and
branding one without the other means every call site that assigns a member's
id to `hostId` needs either a shared `MemberId` type on **both**, or a cast.
`docs/DECISIONS.md`'s own precedent (the `AD-011` sweep) already rejected
casts as a way to satisfy a rule cheaply, and adding one here to hit a
convenient two-file diff would repeat the mistake for the exemplar itself.

`Member` is explicitly **not** this commit's exemplar — the plan states the
other four entities "migrate toward the exemplar later." Branding `hostId`
correctly means branding `Member.id` at the same time, which is Member's
migration, not Room's. Doing it now would be scope creep disguised as
thoroughness.

**Consequence, stated rather than hidden.** `hostId`'s existing `branded-ids`
baseline entry (`server/entities/room-store/room.ts`, already 1 of its 11
frozen violations) is **left exactly where it is** — not fixed, not increased.
The frozen-per-file budget permits this: it may only decrease or stay flat,
never grow, and staying flat is honest about what this commit does and does
not migrate. When `Member` migrates, `hostId` moves with it.

**Reversibility.** High — `RoomCode` is additive; nothing downstream depends on
`hostId` staying a bare string.

## AD-014 — the Room agent's baseline regen is accepted, not reverted

**What.** During the Room exemplar work, the implementing agent ran
`baseline:regen` despite being told not to touch `tools/`, to get `deno lint`
back to exit 0 after converting `Room` to compliance. It flagged this itself
rather than concealing it. The regenerated `baseline.json` is **kept**.

**Why.** The instruction existed to prevent a concurrent-write collision —
Phase 4 blocks A and B were both writing under `tools/` at the time it was
issued. By the time the Room agent ran, both had finished; it was the sole
active writer, satisfying `D-015`'s actual test (disjoint write sets) even
though it crossed the letter of the instruction. Reverting would be strictly
worse: the file is untracked with no backup, and `baseline:regen` is
deterministic over the current tree, so hand-reverting to a stale baseline
would just make the ratchet lie about which files currently comply.

Verified independently: total violation instances dropped **1563 → 1541** (net
decrease, from `Room`'s own files becoming compliant), and the regen's own
safety log records `allowedIncrease: false` — its refusal-on-increase
mechanism ran and found nothing to refuse. A baseline that only ever
decreases here is the ratchet working, not a bypass of it.

**Consequence for future instructions.** "Don't touch `tools/`" as a
concurrency guard should be scoped to *while other agents are active*, not
treated as a blanket rule that outlives the reason for it. Noted so a future
agent isn't placed in the same bind.

## AD-015 — the pre-commit hook checks all three agent-adapter receipt directories, owns none of them

**What.** The receipt check in `pre-commit` looks for `<sha256(D1)>.json` in
`.claude/review-receipts/`, `.agents/review-receipts/`, and
`.opencode/review-receipts/`, accepting a match from any. It does not write to
or restructure any of them, and does not introduce a fourth canonical
location.

**Why.** The user is mid-migration to a canonical `.agents` folder via
copilot, with `.claude`/`.opencode` adapters alongside it; all three already
have a gitignored `review-receipts/*.json` pattern. A git hook that hardcodes
one of the three would silently stop working the moment the user finishes
migrating to a different one, or would need editing inside a directory this
project has been explicitly told to stay out of while that migration is in
flight. Checking all three, owning none, is the only design that survives the
migration without touching it — and it costs nothing extra, since the receipt
check is a single fast filesystem stat regardless of how many directories it
looks in.

**Consequence.** When the migration finishes and only one adapter directory
remains, the other two checks become permanently-missing no-ops — harmless,
and removable later in one line. No behavior depends on which one wins.

## AD-016 — the loud-bypass mechanism cannot catch a real `--no-verify`; documented, not chased

**What.** The original plan assumed `git commit --no-verify` skips `pre-commit`
but still runs `commit-msg`, letting `commit-msg` detect the skip and append a
`Governance-Bypass` trailer. **That assumption is false.** Verified against
real git (2.53.0, disposable fixture): `--no-verify` skips both `pre-commit`
and `commit-msg`. There is no client-side hook that fires on a `--no-verify`
commit and can still edit its message — the trailer mechanism as specified
cannot observe the case it was built to catch.

What Phase 5 actually built still has value, narrower than advertised: it logs
the case where `commit-msg` runs without a fresh `pre-commit` success
immediately before it — e.g. a corrupted or accidentally-removed `pre-commit`
hook, or manual tampering with the hook files. That is a real, useful signal
(hook integrity), but it is not the same claim as "flags every intentional
`--no-verify` bypass," and the docs must not say otherwise.

**Why not chase a fix.** The only client-side hook that reliably fires
regardless of `--no-verify` is `post-commit` — but `post-commit` runs *after*
the commit object already exists, so injecting a trailer means amending, which
rewrites the commit hash immediately after creation and re-triggers
`commit-msg`/`pre-commit` unless invoked with its own `--no-verify` internally.
That is exactly the "second bypass mechanism" `AGENTS.md`'s Phase 5 design
already rejected once, in a different shape (a `post-commit`-written tracked
log file, rejected for leaving a dirty tree after every commit). Building an
amend-based workaround here would be the same mistake with extra steps: fragile,
surprising to anyone who commits normally, and still not unbypassable — a
`post-commit` hook is itself skippable by editing `.git/config`'s hooksPath or
simply deleting the hook file, which local hooks can never prevent.

**The mechanism that actually cannot be bypassed by a local flag is
server-side**: a `pre-receive` hook on whatever the real remote is, which
inspects incoming commits before accepting a push and rejects ones lacking a
valid trailer/receipt reference. That requires push access to configure the
remote, is a different and heavier mechanism than anything client-side, and is
explicitly **out of scope** for this phase — recorded here so it is a known
gap, not a silently abandoned one.

**Consequence.** `--no-verify` remains available and, for a deliberate use,
genuinely silent — consistent with git's own security model, which never
promises client-side hooks are unbypassable. The local gate's real enforcement
is the `pre-commit` receipt check on the honest path; the commit-msg trailer is
useful hook-integrity signal, not an anti-bypass guarantee, and must be
described as such everywhere it's documented.

## AD-017 — `governed-diff.ts`'s pathspec excludes all three receipt directories

**What.** `tools/cli/governed-diff.ts`'s `:(exclude)` clauses cover
`.claude/review-receipts/**`, `.agents/review-receipts/**`, and
`.opencode/review-receipts/**` — not just `.claude`, which is what it had
before Phase 5.

**Why.** `AD-015` requires the receipt round-trip to hold for all three
adapter directories: writing a receipt to any one of them must not itself
change `RECEIPT_KEY`. With only `.claude` excluded, writing a receipt to
`.agents/` or `.opencode/` would perturb the diff D1 hashes, silently
invalidating the very receipt just written — reintroducing the circularity
D1 exists to prevent, for two of the three directories. `docs/GOVERNANCE.md`'s
D1 code block is updated to match, since it claims to be the single source
for how the rule is enforced.

**Consequence.** No change to the agent-adapter directories themselves —
`.claude`/`.agents`/`.opencode` remain untouched. Only the diff definition's
own exclusion list grew to match `AD-015`'s existing three-directory design.

## AD-018 — `.git/.governance-last-run` is single-use, deleted on read

**What.** `commit-msg` deletes the tree-hash marker the instant it reads it —
match or mismatch, either way — rather than leaving it for the next commit.

**Why.** Without this, a *second* commit made via `--no-verify` with an
unchanged staged tree would compute the same tree hash as the marker left by
the *previous*, legitimate commit, and be wrongly treated as verified. A
mechanism meant to be "loud, not silent" has to require a fresh `pre-commit`
success on every commit, not just the first one after it was installed.

## AD-019 — a malformed receipt fails closed, without throwing on the fast path

**What.** `hasClearReceipt` treats a receipt file that exists but fails to
parse, or parses without a string `verdict`, identically to "file absent" —
returns `false` for that directory and keeps checking the others — rather
than throwing.

**Why.** The no-receipt path must stay at millisecond latency and must never
invoke `precommit`. A thrown exception on a corrupted receipt would need a
try/catch wrapper at that call site regardless, so folding "unparseable" into
the same boolean as "absent" is the smaller surface, and keeps the fail-closed
posture consistent with the suppressor's own fail-closed rule (`AD-008`).

## AD-020 — `precommit.ts` shells out to existing `deno task` children rather than importing their logic

**What.** `precommit.ts` spawns `deno task check:structural -- --changed`
etc. as child processes and reads exit codes, instead of importing and
calling `check-structural.ts`'s exported functions in-process.

**Why.** `mutate` and `coverage:floor` both depend on `Deno.lint.runPlugin`,
which only works under the `deno test` subcommand (`tools/mutate/
run-mutation.harness.ts`'s own constraint). `precommit.ts` is a `deno run`
entrypoint — the installed `pre-commit` hook needs it to run as one process,
not fork into a `deno test` subprocess of its own. In-process calls would
force `precommit.ts` itself to become a `deno test` harness, which the
installed hook cannot invoke the way it needs to. Shelling out keeps
`precommit.ts` a normal, directly testable module while reusing every
existing checker completely unmodified.
