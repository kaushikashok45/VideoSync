# GOVERNANCE.md — how every rule is enforced

This is the **single source for _how_ a rule is checked.** Every other governance
document (`AGENTS.md`, `docs/CODING_STANDARDS.md`, the PRD) states a rule once and
links here for its enforcement. If a rule's mechanism is described anywhere else,
that copy is wrong — fix it to point here.

The governing principle: **nothing is enforced by hoping an agent read a
document.** A rule is either a machine check (a Deno lint plugin, a `deno task`,
or a git hook) or an explicitly named reviewer lens. A principle parked in
"reviewer judgement" with no named owner is, in practice, unenforced — an LLM's
opinion, not a gate.

## Status legend

This document is authored in **Phase 1** and specifies the target enforcement.
The checkers it names are built in Phase 2–5. Each row is tagged:

- **[live]** — implemented, registered, and running on every `deno lint`.
- **[live]** — the checker exists and is fully tested, but is **not** yet in
  `deno.json` → `lint.plugins`, so it does not run automatically. It is reachable only
  from its own tests, which drive it through `Deno.lint.runPlugin` — the matching
  `check:*` task cannot work until registration, because a task runs under `deno run`
  and `runPlugin` is a `deno test`-only API. Registration happens in commit 7 alongside the
  baseline seed, because a plugin registered before the baseline exists fails closed and
  would turn `deno lint` red across the whole tree [why](#tier-1--enforced-exactly).
- **[planned:Pn]** — specified here; implemented in Phase _n_. This document is
  the spec that implementation must satisfy.

Until a row is `[live]`, the rule is enforced by reviewer vigilance as a
stopgap — but the target is mechanical, and the plan does not consider a rule
"done" until its row flips to `[live]`.

---

## The governed diff (D1)

Every component that hashes, reviews, or scopes to "the change" uses **this one
command** — never a hand-rolled variant:

```bash
git -c core.abbrev=40 diff --cached --no-color --no-ext-diff -U3 \
  -- . ':(exclude).claude/review-receipts/**' \
     ':(exclude).agents/review-receipts/**' \
     ':(exclude).opencode/review-receipts/**'
```

- **Staged, not branch-relative** — a commit gate governs what is being committed.
- **`--no-color --no-ext-diff -U3`** pinned so the bytes reproduce across machines.
- **Receipts excluded** — without this the receipt mechanism is circular: writing
  the receipt would change the diff that the receipt certifies. All three adapter
  directories are excluded, and none is treated as canonical
  (`docs/DECISIONS.md#ad-015`).

`RECEIPT_KEY = sha256(that patch text)`. The changed-file list is `--name-only` on
the same command; every `check:* --changed`, `mutate`, and `coverage:floor`
consumes that one list. CI passes `--all` instead; nothing else differs.
Implemented once in `tools/cli/governed-diff.ts` **[planned:P2]** and imported by
every consumer — no component computes its own diff.

## Order of operations (D2)

```
edit → git add → deno task precommit   (all machine checks, no LLM)
     → /review-now                      (cold panel; REFUSES to run until precommit is green)
     → git commit                       (hook checks the receipt first, then re-verifies)
```

`/review-now` gating itself on a green `precommit` is what lets the commit hook be
cheap: a receipt's existence already **implies** every machine check passed for
that exact diff, so the hook checks the receipt first (milliseconds) rather than
paying for mutation testing only to discover there is no receipt.

---

## Tier 1 — enforced exactly

A machine computes a precise answer; there is no judgement.

| Rule | Mechanism | Status |
|---|---|---|
| All structural limits in CODING_STANDARDS.md §1 (complexity, body, file, depth, params) | `structural-plugin` / `check:structural` | **[live]** |
| FSD layer direction; no cross-slice deep imports; slice has `index.ts` + contract | `boundary-plugin` / `check:boundary` | **[live]** |
| No import cycles | `tools/graph/cycles.ts` (Tarjan over `edges.jsonl`) | **[live]** |
| Dumb UI: no store/model/api import; no `useState`/`useEffect`/`useReducer`/`useContext` | `dumb-ui-plugin` / `check:dumb-ui` | **[live]** |
| Contract-first: a new slice's first commit is contract + `index.ts` only | `boundary-plugin` diff-shape rule | **[live]** |
| Every entity + invariant documented and bound to a named test | `erd:check` | [planned:P4] |
| No surviving mutant on changed files | `tools/mutate` (`deno task mutate --changed`) | [planned:P4] |
| Branch-coverage floor on changed files | `tools/coverage/floor.ts` (`coverage:floor`) | [planned:P4] |
| Existing violations never increase | ratchet baseline (`tools/baseline`) | **[live]** |
| Commit blocked without a valid review receipt | `pre-commit` hook + receipt round-trip | [planned:P5] |
| Canonical terminology; no new banned synonyms; grandfathered terms frozen | `terminology:check` against `docs/PRODUCT-MODEL.md` | [planned:P2] |
| Pipeline artifacts traced: every `CAP-<n>` reaches a screen, a slice, and (active phase) a named test | `pipeline:check` | [planned:P4] |
| A `BLOCKED` readiness scorecard may not carry populated capabilities | `pipeline:check` | [planned:P4] |

### Counting cyclomatic complexity

The counting convention and every threshold are defined in
**CODING_STANDARDS.md §1** and are not restated here. `structural-plugin` must
implement that convention exactly — §1 is its specification.

### Threshold selection — why legacy `components/` counts as presentation

§1 defines *which* files are presentation. The reason it includes the legacy
`components/` directory alongside `ui/` belongs here: keying only on `ui/` would
give legacy JSX the *stricter* logic bound, so moving a file into `ui/` would
simultaneously loosen its complexity budget and trip the new-path zero-tolerance
rule — making migration strictly harder than standing still. Presentation is
presentation regardless of the directory's name.

### `tools/**` carve-out

`tools/**` is exempt from the boundary and dumb-UI checkers (it is not FSD) and
granted the presentation complexity bound. Rationale, recorded here rather than
left implicit:
graph algorithms (Tarjan's SCC) and CLI argument handling are irreducibly
branchy, encode no domain invariant, and forcing them through single-decision
functions produces worse code than it prevents. This is a stated carve-out with a
reason, not an unexamined exception.

---

## Tier 2 — mechanical proxies (`semantics-plugin`) [planned:P2]

These do not _prove_ a principle; they make violating it structurally awkward and
violating it _silently_ impossible. That is the honest claim, and it is worth far
more than a prose reminder. All are implemented in `semantics-plugin` and run by
`deno task check:semantics`.

### Tell, Don't Ask

The mechanical signature of "asking" is reading another object's state to make a
decision.

- **`no-demeter`** — member-access depth > 2 on a non-`this` root (`a.b.c`)
  outside the module owning the root's type.
- **`no-entity-interrogation`** — a comparison whose operand is a member
  expression rooted at a value imported from `entities/**` or a sibling
  `model/**`, against a literal. `room.state === "ended"` is illegal outside
  Room; `room.hasEnded()` is the fix. Composes with the complexity cap: you may not
  branch _and_ may not ask, so the entity has to tell.
- **`readonly-entity-fields`** — every property of a type declared in
  `entities/**` or `model/**` must be `readonly`. Mutation goes through exported
  behaviour, not field assignment.

### SOLID — one checkable proxy per letter

- **S** — `one-public-export`: at most one exported symbol per module, except
  `index.ts`, `contracts/*`, and tests. (This is AGENTS.md's own "one entity per
  file" rule, previously with zero enforcement.)
- **O** — `no-foreign-switch`: a `switch` whose discriminant is a member
  expression on an imported entity value. Adding a variant should not force
  editing every consumer; the entity dispatches.
- **L** — `no-stub-override`: a member carrying `override` whose body is only a
  `throw`. A subclass that cannot honour the base contract is not substitutable.
- **I** — **not mechanizable without type information → Tier 3**
  (`reviewer-architecture`).
- **D** — `no-concrete-transport-in-domain`: `entities/**`, `model/**`, `lib/**`
  may not import `socket.io`, `socket.io-client`, `simple-peer`, or `express`.
  Transport arrives as an injected port; only `api/**` and `shared/api/**` may
  name a concrete one.

### Semantic entities

- **`branded-ids`** — a field named `*Id`/`*Code`/`*Key` in `entities/**` or
  `shared/contracts/**` may not be typed bare `string`/`number`; it needs a
  branded type. This makes `roomId: string` illegal, so a `MemberId` can never be
  passed where a `RoomId` belongs — the strongest single lever for semantic
  entities.
- **`no-empty-names`** — bans `data`, `info`, `item`, `obj`, `temp`, `val`,
  `res`, `ret`, `stuff`, `thing`, `helper`, `util`, `manager`, `handler` as bare
  identifiers, and single letters outside loop heads.

### Clean code / anti-slop

- **`no-swallowed-error`** — empty `catch`, or a catch that neither rethrows nor
  reports.
- **`no-magic-literal`** — in `entities/**`/`model/**`, literals other than
  `0`, `1`, `-1`, `''`, `true`, `false` must be named constants (with an
  allow-list for array indices, `slice(0, 1)`, and HTTP-ish status numbers in
  `api/**`). **Test files are exempt**, and not merely to reduce noise: in a
  test the literal *is* the specification. `assertEquals(count, 3)` states the
  expected value independently of the code under test; replacing the `3` with a
  constant imported from that code makes the assertion tautological, so it can
  no longer catch a wrong constant. Measured on the live tree, 1010 of 1165
  findings came from test files — all of whose correct resolution was to do
  nothing.
- **`no-default-export`** — named exports only, so every symbol is greppable.
  **Carve-out, path-exact and closed:** React Router discovers a route module by
  path and reads its default export, so the rule exempts `app/routes.ts`,
  `app/root.tsx`, `app/entry.server.tsx`, `app/entry.client.tsx`, and — under
  `app/routes/` — only a top-level `<name>.tsx` or a `<name>/route.tsx`.
  Colocated `components/**` and `logic/**` beneath `app/routes/` are **not**
  exempt: the framework contract covers files it loads by path, not files that
  merely live nearby, and those colocated modules are exactly the ones other
  code imports by name. Exempting `app/routes/**` wholesale would turn a
  framework accommodation into a style loophole (17 files exempt instead of 9,
  8 of them for no reason). The list encodes a framework fact, so it changes
  only when the routing convention does.
- **`no-loose-assertion`** — `as` and non-null `!` banned outside `api/**` parse
  boundaries, where external data legitimately enters.
- **`no-unowned-todo`** — `TODO` without an owner and reference.
- **`no-console`** — outside `server/shared/logger`.

### No helpers

Filename bans alone are sidestepped by a well-named helper bag, so three rules
combine:

- **`no-dumping-ground`** — bans `utils`/`helpers`/`misc`/`common`/`types`
  filenames and same-named directories inside a slice. `lib/` is the sanctioned
  home for slice-private pure functions; `index.ts` is legal only at a slice root;
  `constants.ts` only under `contracts/`.
- **`one-public-export`** — a module cannot _be_ a bag of loose functions
  regardless of its name. This is the rule that actually bites.
- **`deep-import`** — makes `lib/` genuinely slice-private, so a helper cannot
  leak across a boundary even if written.

### Modular boundaries (graph rules)

- **`public-surface-cap`** — a slice's `index.ts` exports ≤ 7 symbols, so the
  public entry cannot quietly become a barrel.
- **`slice-fan-out-cap`** — a slice imports ≤ 3 other slices. `entry-flow`
  imports 4 today, so this lands in the baseline and can only improve.

### Honest scope limit

These rules see imported _value_ bindings, not types, so they catch the common,
important case — a module importing an entity and interrogating it — and miss an
entity arriving as an un-annotated function parameter. That residue is
`reviewer-architecture`'s (Tier 3). A checker that silently under-reports is worse
than one with a documented edge, so the edge is documented here.

---

## Tier 3 — irreducible, panel-owned

Genuinely not mechanizable. Each is an **assignment to a named reviewer**, not a
hope. The cold panel (four fresh subagents, no session history, OR-blocking
aggregation) is specified in **CODING_STANDARDS.md §5** and built in
**[planned:P3]**.

| Rule | Owner | Why not mechanical |
|---|---|---|
| ISP — is this interface too fat for its consumers | `reviewer-architecture` | needs type-checker info on which members each consumer uses |
| Premature abstraction / YAGNI | `reviewer-architecture` | requires knowing whether a consumer will exist |
| Whether a name is _correct_ | `reviewer-architecture` | Tier 2 proves a name isn't empty, never that it's right |
| `useRef`-as-state; contract import is types-only | `reviewer-architecture` | lint AST carries no type information |
| Entity arriving as an un-annotated parameter | `reviewer-architecture` | no type info to resolve the parameter's origin |
| Whether a named test _proves_ its invariant | `reviewer-contracts-tests` | `erd:check` proves binding, not adequacy |
| Contract semantic drift since kickoff | `reviewer-contracts-tests` | requires intent comparison |
| Logic bugs, off-by-one, error/edge paths | `reviewer-correctness` | requires reasoning about behaviour |
| Boundary validation, races, capacity, socket-payload trust | `reviewer-security-concurrency` | requires threat/timing reasoning |
| Design fidelity — does the built feature match the approved Figma design | `reviewer-design-fidelity` | requires inspecting the Figma design and driving the running implementation and comparing them; no stored baselines |
| Visual verification against brand intent | human | not a code property |

---

## The ratchet baseline [planned:P2]

`tools/baseline/baseline.json`, committed. Three mechanisms, because a naive
ratchet is trivially gamed:

- **Content-derived violation identity**, never `file+line`:
  `hash(ruleId + enclosingFunctionName + paramCount + hash of the body's first 3
  non-blank statements)`. Edits above a violation cannot "fix" it.
- **Unknown path = zero tolerance.** The baseline stores a path set of every file
  at generation time; a path absent from it must be fully compliant. This defeats
  renaming `bad.ts` → `bad-2.ts` and makes splitting a large file _stricter_, not
  looser — the intended migration incentive.
- **Frozen per-file budget** — an existing file's violation count may only
  decrease, so you cannot fix one thing and smuggle in two.

**Legacy zone**: `app/features/{videoPlayback,webRTC,webSocket,toastMessages}`,
`app/common`, `app/context`, `app/routes`, `app/utils`. Exempt from the boundary
checker (pre-FSD, not migrating incrementally), still ratcheted for structural
limits. The zone **freezes** debt, it does not license new debt: a new file under
a legacy path still gets zero-tolerance, and a file moved _out_ is new at its
destination and must fully comply.

---

## Architecture invariants (`ARCH-<n>`)

The invariants a feature's architecture is checked against. **Each names its
verifier.** An invariant with no checker is reported `UNVERIFIED`, never `PASS` — an
invariant nobody verifies is a hope with an id number, and letting an agent assert
`PASS` on its own reading is the failure this table exists to prevent.

| ID | Invariant | Verified by | Status |
|---|---|---|---|
| `ARCH-001` | No module imports from a higher FSD layer | `check:boundary` (`layer-order`) | **[live]** |
| `ARCH-002` | Presentation is props-only: no store/model/api import, no local state hooks | `check:dumb-ui` | **[live]** |
| `ARCH-003` | Domain code (`entities/`, `model/`, `lib/`) never imports a concrete transport | `check:semantics` (`no-concrete-transport-in-domain`) | [planned:P2] |
| `ARCH-004` | **Room isolation** — no server operation reads or mutates a room other than the one the acting socket belongs to | `reviewer-security-concurrency` | **UNVERIFIED** |
| `ARCH-005` | Every server mutation states what it trusts; anything gated only client-side is labelled **advisory** | `reviewer-security-concurrency` | **UNVERIFIED** |
| `ARCH-006` | Client state is never the canonical source of shared state | `reviewer-architecture` | **UNVERIFIED** |
| `ARCH-007` | Cross-slice access only through a slice's public entry | `check:boundary` (`deep-import`) | **[live]** |
| `ARCH-008` | A new abstraction requires justification when an existing one exists | `reviewer-architecture`; partly `one-public-export` / `no-dumping-ground` | **partly UNVERIFIED** |
| `ARCH-009` | **Wire-protocol changes are backward-compatible or explicitly versioned** | `reviewer-contracts-tests` | **UNVERIFIED** |
| `ARCH-010` | Async and multi-step operations have explicit lifecycle semantics (pending / success / failure / cancellation) | `reviewer-correctness` | **UNVERIFIED** |
| `ARCH-011` | Every piece of state has exactly one owner and one canonical representation | `reviewer-architecture` | **UNVERIFIED** |

### Why these, and not the generic set

Four invariants from the generic SaaS playbook have **no referent** in this product
and are deliberately replaced by their local analogue:

| Generic invariant | Absent because | Replaced by |
|---|---|---|
| tenant-owned resources carry tenant context | no accounts, orgs, or plans (`PD-003`) | `ARCH-004` room isolation — the real isolation boundary here is the room, and one shared in-memory `RoomStore` holds every room |
| every server mutation requires authorization | identity is unauthenticated, so authorization cannot be *required* honestly | `ARCH-005` — a mutation must **state what it trusts**, and client-only gating must be labelled advisory rather than presented as a permission |
| schema migrations are backward-compatible | no database of any kind | `ARCH-009` — `shared/contracts/` is the contract between two **independently deployed halves**; a pre-deploy client talks to a post-deploy server, and the socket protocol currently has **no versioning at all** |
| DB transaction boundaries | no transactions | single-threaded JS gives per-tick atomicity for free; what is *not* free is **event ordering across sockets**, which `ARCH-010` covers |

`ARCH-004` carries the weight that "can tenant A see tenant B's data" carries in a
multi-tenant product. Every room lives in one process, in one `Map`, addressed by a
5-character code. Treat any path that could read across that boundary as the most
serious class of defect available here.

## Product-layer enforcement

The tiers above govern *code*. Two checkers govern the *product* layer, and they
share their reference-binding module with `erd:check` — all three parse structured
ids out of markdown and resolve them across files, and all three must **fail loudly**
on a non-literal `Deno.test` name rather than pass silently.

### `terminology:check` [planned:P2]

Enforces the ontology in `docs/PRODUCT-MODEL.md` across docs and code identifiers:

- **Canonical terms** — `room`, `member`, `viewer`, `host`, `media source`.
- **Banned synonyms** — `party` (as a code noun), `lobby`, `participant`, `guest`,
  `attendee`, and the rest of the model's table. `party` stays legal in user-facing
  copy, which is why the rule must distinguish string literals shown to users from
  identifiers.
- **Protected distinct terms** — `session` ≠ `room`, `peer` ≠ `member`, playback
  *action* ≠ playback *status*. A naive synonym checker would collapse these and
  force genuinely wrong renames; the model's "distinct terms that only look like
  synonyms" table is what prevents that, and the checker must consult it.
- **Grandfathered terms are ratcheted, not exempted** — `Reciever*` exists 14 times
  across 8 files including a **live route**, so existing occurrences freeze and any
  new occurrence fails. Same mechanism as structural violations: debt is frozen
  without licensing more of it, and no repo-wide rename is demanded first
  (`PD-009`).

A terminology change requires a `docs/DECISIONS.md` entry, because it invalidates the
ratchet baseline.

### `pipeline:check` [planned:P4]

Enforces the artifact contract in `docs/PIPELINE.md`. The rule that carries the most
weight: **a `BLOCKED` readiness scorecard with populated capability sections is a hard
failure.** That is the mechanism enforcing "no polished spec before the uncertainty
is resolved" — without it, the scorecard is a decoration an agent can route around
by simply writing the spec anyway.

## The escape hatch [live]

`git commit --no-verify` is the only bypass — no second one is built.
`pre-commit` records the tree hash on success; `commit-msg` compares it and
appends `Governance-Bypass: true (pre-commit skipped)` on a mismatch.

**This catches hook-integrity failures (a corrupted, removed, or tampered
`pre-commit` hook), not a deliberate `--no-verify`.** Verified against real
git: `--no-verify` skips `pre-commit` **and** `commit-msg` together, so a
genuine bypass leaves no trailer — there is no client-side hook that fires on
a `--no-verify` commit and can still edit its message. See
`docs/DECISIONS.md#ad-016` for why this isn't chased further: the only
mechanism that actually cannot be bypassed by a local flag is a server-side
`pre-receive` hook on the real remote, which is a heavier, different
mechanism and out of scope here. CI re-runs the full deterministic pipeline on
every push regardless, so `--no-verify` skips local fast-fail convenience,
never the repo-wide checks — it just does so silently rather than loudly.
