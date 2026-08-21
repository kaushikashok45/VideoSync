# Coding Standards — The Sync Party

Authoritative coding standards for The Sync Party. These complement AGENTS.md (governance)
and are enforced by machine checkers (`deno lint` plugins + `deno task check:*`).

## 1. Size & structure limits (machine-enforced)

These are enforced by the project's own Deno lint plugin (`structural-plugin`,
run by `deno task check:structural`), not by reviewer judgement. New and changed
code is **hard-blocked** on any violation; existing violations are frozen by the
ratchet baseline and may only decrease. The check **fails** the commit if any are
violated on new or changed code:

| Metric | Limit | Notes |
|---|---|---|
| Function/arrow body length | ≤ 20 lines | Counting the body only (excluding signature and closing brace). |
| File length | ≤ 150 lines | Except generated files, `shared/contracts` maps, and **test files** — see below. |
| Indentation depth | ≤ 2 levels past the function body | No deeply nested callbacks/conditionals. Prefer early returns and small helpers. |
| Cyclomatic complexity | **≤ 2 in logic**, **≤ 4 in presentation** | Presentation = a `.tsx` under a slice's `ui/` or legacy `components/`. Everything else is logic. See counting convention below. |
| Parameters per function | ≤ 4 | Use a single options/params object beyond that. |
| Nesting of Promise chains | ≤ 2 | Prefer `async`/`await` over nested `.then` chains. |

**Failing a size rule is a review-blocking defect**, not a suggestion.

### Why test files are exempt from the file-length cap

The ≤ 150 limit exists to stop god-modules, where length is a proxy for tangled
responsibility and coupling. A test file is a **flat list of mutually
independent cases** — adding the 200th `Deno.test` block makes the 199th no
harder to understand — so the cost the cap prices in is simply absent.

More decisively, this project mandates five test categories per capability
(happy, sad, edge, mutation, logical-limits). A 150-line cap on test files would
cap the one thing every other rule demands more of, which is governance
penalising thoroughness. Rules like that get routed around, and deservedly.

Every other size limit in the table above still applies inside a test file: a
single test's body is still ≤ 20 lines, and a helper inside a test file is still
held to the complexity cap. Only the whole-file line count is exempt.

### Counting cyclomatic complexity

Complexity starts at **1** for a straight-line function and increments by one per
decision point: `if`, `else if`, each `case`, `for`, `while`, the `?:` ternary,
and each `&&`, `||`, `??`. A plain `else` adds nothing (no new branch).

- **≤ 2 (logic) therefore permits exactly one decision point.** A guard clause
  *plus* a ternary is 3 and fails. `a ?? b` counts as a decision point.
- **≤ 4 (presentation)** gives dumb UI room for a few conditional-render
  branches, but no more — real branching belongs in `model/`, not JSX.
- Nested function expressions (callbacks, inline arrows) are scored
  **separately**, each against its own limit, never folded into the parent.
- This is the highest-friction rule in the system by design: at ≤ 2, the way to
  comply is to move the decision into an entity that *tells* (a predicate or
  behaviour method) rather than branching on state you *asked* for — which is
  exactly Tell-Don't-Ask. The `≤ 20`-line body and `≤ 150`-line file limits stay
  as written but stop being the binding constraint once complexity is capped this
  low.

## 2. Minimality, reuse & engineering principles (reviewer-enforced)

The default implementation is the smallest complete change that satisfies the
current requirement and its contract. More code is not evidence of more
quality. The reviewer blocks code that adds complexity without a present,
demonstrable benefit.

- **Smallest viable change:** implement only the requested behavior, required
  supporting code, and tests. Do not add speculative features, future-proofing,
  wrappers, dependencies, configuration, or unrelated cleanup.
- **Search before create:** search the repository for an existing owner,
  component, hook, function, contract, constant, utility, or dependency before
  adding one. Prefer extending the existing owner over creating a parallel one.
- **Single source of truth:** shared behavior, state transitions, constants,
  validation, and data transformations have one canonical implementation.
  Duplicated logic is a blocking defect unless the reviewer can identify a
  deliberate, documented boundary that requires separate behavior.
- **DRY with judgment:** extract meaningful repeated behavior, not merely similar
  text or coincidental shapes. Avoid generic helpers that make callers harder
  to understand or hide domain ownership.
- **YAGNI and KISS:** a new abstraction must have a current consumer, one clear
  responsibility, and a concrete reason existing code cannot be reused. Prefer
  direct control flow and existing dependencies over speculative extensibility,
  clever patterns, or unnecessary indirection.
- **High cohesion, low coupling:** keep behavior close to the domain that owns
  it, minimize cross-feature knowledge, and preserve UI / logic / contract
  boundaries. Do not move code to a catch-all `utils.ts` to make duplication
  disappear.
- **Explicit boundaries:** validate external input and network data at the
  boundary where it enters the system. Use typed contracts, explicit error
  paths, and recoverable outcomes rather than implicit assumptions.
- **Delete excess:** remove dead branches, unused parameters, obsolete state,
  redundant wrappers, and unreachable code when the change makes them
  unnecessary. Do not leave code in place “just in case.”
- **Preserve scope:** unrelated refactors, broad rewrites, formatting churn,
  renames, dependency changes, and architecture changes belong in separate
  tasks.
- **Complexity is a budget:** when a change would exceed the limits in §1,
  split responsibilities, use early returns, or simplify the design. Do not
  satisfy a line limit by scattering one behavior across needless helpers.

### Required minimality review

Before accepting a change, the reviewer must ask:

1. Could an existing implementation have been reused?
2. Does every new file, function, branch, dependency, and abstraction have a
   current requirement and a clear owner?
3. Is any logic, state, validation, or terminology duplicated?
4. Can any code be removed without reducing the requested behavior or its
   test coverage?
5. Did the change preserve existing behavior and avoid unrelated scope?

An unsatisfactory answer is a blocking finding until the code is simplified,
reused, moved to its correct owner, or the reason is documented.

## 3. Linter configuration (`deno.json`)

- `deno lint` runs with the **recommended tag as errors**. This already enables the strict
  rules that matter here: `no-explicit-any`, `ban-ts-comment`, `no-unused-vars`,
  `no-window`, `no-window-prefix`, `require-await`, `no-inner-declarations`, and more.
- **Structural rules are enforced by project lint plugins**, registered under
  `deno.json` → `lint.plugins`. Deno 2.9's plugin API exposes an ESTree-like AST
  (with JSX) and the full `Deno` API inside a rule, so complexity, body length,
  file length, nesting depth, and param count **are** checkable in-linter — the
  earlier claim that they "are not available in Deno lint" is obsolete. The four
  plugins are `structural`, `boundary`, `dumb-ui`, and `semantics`; each `check:*`
  task adds ratchet-aware pass/fail on top. See `docs/GOVERNANCE.md` for the full
  rule → plugin → task map.
- `no-undef` is intentionally **not** enabled: it mis-fires on legitimate browser/Node
  globals (`document`, `process`, `MediaStream`) in this mixed-runtime project and Deno
  lint offers no custom-globals config for it. `reviewer-correctness` catches genuinely
  undefined identifiers and typos instead.
- Do not add a rule that produces more noise than signal. A rule that cannot be
  mechanized cleanly belongs to a named reviewer lens in §5, not to a noisy plugin.

Run locally with `deno task lint`; CI runs `deno task verify` (which includes it) on every PR.

## 4. Code smells

**Most of these are now machine-blocked**, not left to reviewer vigilance:
long functions / deep nesting / excess complexity (`structural-plugin`), the
`utils.ts` dumping ground and FSD layer violations (`boundary-plugin`),
Tell-Don't-Ask, swallowed errors, magic literals, and naming drift
(`semantics-plugin`). They are listed here so the *intent* behind each rule is
documented in one place; `docs/GOVERNANCE.md` maps each to its enforcing task.
The panel (§5) owns only the residue a rule cannot express. Each smell **blocks**:

1. **Long functions** (over the §1 body limit) — split by moving decisions into
   the owning entity, not by scattering one behaviour across helper files.
2. **Deep indentation** (over the §1 depth limit) — extract conditions into small
   predicate functions and use early returns.
3. **Accidental complexity** — a function that does more than one thing, or whose
   cyclomatic complexity exceeds its §1 limit.
4. **Code duplication** — the same logic in two places (extract to the slice that owns it;
   never to a `utils.ts`).
5. **Tell, Don't Ask violations** — callers inspecting state to decide instead of commanding.
6. **FSD layer violations** — imports pointing outward/upward, or cross-feature imports.
7. **Premature abstraction** — speculative helpers with no consumer (YAGNI).
8. **Naming drift** — misleading names, `any` in public signatures, `Reciever*` used instead
   of `Receiver*`.
9. **Dead code / unused params** — anything that `deno lint`'s `no-unused-vars` would catch,
   plus comments that restate code.
10. **Swallowed errors** — empty `catch {}`, unhandled `AppError` without a recovery path.
11. **Unnecessary code** — speculative features, pass-through wrappers, redundant state,
    unused configuration, or abstractions without a current consumer.
12. **Scope creep** — unrelated refactors, formatting churn, dependency changes, or broad
    rewrites bundled into a focused task.

## 5. Reviewer panel mandate

Review is a **cold panel of four independent subagents**, not one reviewer. Each
is spawned fresh via `Task` with **no session history** and is given only the
governed diff, `ERD.md`, the governance docs, and the stated intent — never the
implementing session's plan or transcript. Run the panel with `/review-now`.

| Reviewer | Lens |
|---|---|
| `reviewer-correctness` | logic bugs, off-by-one, error/edge paths, ERD invariant violations, genuinely undefined identifiers |
| `reviewer-architecture` | **Tier 3 only** — ISP, premature abstraction/YAGNI, whether a name is *correct* (not merely non-empty), `useRef`-as-state, types-only contract imports, entity-arrives-as-parameter cases the plugins cannot resolve. Does **not** re-derive machine findings |
| `reviewer-contracts-tests` | contract fidelity vs kickoff, the five coverage categories, mutation adequacy, whether a named test *actually proves* its invariant |
| `reviewer-security-concurrency` | boundary validation, room/playback races, capacity limits, socket-payload trust |

- Each reviewer is a *fresh, independent pass* — it does not implement; it only
  reviews and reports `file:line`, the concrete state that breaks, and
  `BLOCKING` / `NON_BLOCKING`. An empty list must be stated explicitly.
- The panel spends its budget where **no machine rule reaches** (Tier 3). It
  trusts the plugins for §1 limits, boundaries, and Tier 2 semantics rather than
  re-deriving them; `docs/GOVERNANCE.md` names which tier owns what.
- **Aggregation is OR-blocking:** any single reviewer's `BLOCKING` blocks the
  commit; no reviewer's `NON_BLOCKING` can downgrade another's `BLOCKING`.
- A reviewer must not accept "this looks intentional." If the diff looks wrong
  for the stated intent, it says so rather than assume an unseen good reason.
- Reviewers never silently fix — they report; the implementer fixes.

## 6. PR granularity

- Work is grouped into **feature-sized PRs** (all entities, then all features, then wiring),
  each PR small enough to review in one sitting.
- A PR is **rejected** if it exceeds ~300 changed lines or touches more than ~6 files, or if
  it mixes unrelated concerns (e.g. a bug fix inside a feature PR).
- The reviewer refuses to review oversized PRs and requests a split before proceeding.
- Each PR must pass `deno task verify` (fmt + lint + check + test) before review.
