# Coding Standards — The Sync Party

Authoritative coding standards for The Sync Party. These complement AGENTS.md (governance)
and are enforced by `deno lint` (machine rules) and the reviewer agent (structural rules).

## 1. Size & structure limits (reviewer-enforced)

Deno's linter has no complexity/depth/length rules, so these are enforced by the reviewer
agent at every task review. A review **fails** if any are violated:

| Metric | Limit | Notes |
|---|---|---|
| Function/arrow body length | ≤ 20 lines | Counting the body only (excluding signature and closing brace). |
| File length | ≤ 150 lines | Except generated files and `shared/contracts` maps. |
| Indentation depth | ≤ 2 levels past the function body | No deeply nested callbacks/conditionals. Prefer early returns and small helpers. |
| Cyclomatic complexity | ≤ 8 per function | Count decision points: `if`/`else if`/`for`/`while`/`case`/`&&`/`||`/`??`. Split when exceeded. |
| Parameters per function | ≤ 4 | Use a single options/params object beyond that. |
| Nesting of Promise chains | ≤ 2 | Prefer `async`/`await` over nested `.then` chains. |

**Failing a size rule is a review-blocking defect**, not a suggestion.

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
- `no-undef` is intentionally **not** enabled: it mis-fires on legitimate browser/Node
  globals (`document`, `process`, `MediaStream`) in this mixed-runtime project and Deno
  lint offers no custom-globals config for it. The **reviewer** is responsible for catching
  genuinely undefined identifiers and typos instead.
- Structural rules (cyclomatic complexity, max lines, max depth) are **not** available in
  Deno lint; the reviewer enforces them per §1.
- Do not add a rule that produces more noise than signal. When in doubt, prefer the
  reviewer to enforce judgment-based rules.

Run locally with `deno task lint`; CI runs it on every PR.

## 4. Code smells the reviewer must look for

The reviewer scans each change for these smells and **blocks** on any of them:

1. **Long functions** (> 20 lines body) — split into named helpers with clear intent.
2. **Deep indentation** (> 2 levels past the body) — extract conditions into small
   predicate functions and use early returns.
3. **Accidental complexity** — a function that does more than one thing, or whose
   cyclomatic complexity exceeds 8.
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

## 5. Reviewer mandate

- A **secondary reviewer agent** runs after every task in the implementation plan.
- The reviewer is a *fresh, independent pass* — it does not implement; it only reviews and
  reports.
- The reviewer checks: §1 size limits, §2 minimality, §4 smells, FSD layer rules, Tell-Don't-Ask, SOLID
  adherence, error-model compliance, and test coverage depth (all five categories).
- Findings are reported as blocking vs non-blocking. Blocking findings must be fixed before
  the task is accepted; non-blocking findings are logged as follow-ups.
- The reviewer never silently fixes — it reports; the implementer fixes.

## 6. PR granularity

- Work is grouped into **feature-sized PRs** (all entities, then all features, then wiring),
  each PR small enough to review in one sitting.
- A PR is **rejected** if it exceeds ~300 changed lines or touches more than ~6 files, or if
  it mixes unrelated concerns (e.g. a bug fix inside a feature PR).
- The reviewer refuses to review oversized PRs and requests a split before proceeding.
- Each PR must pass `deno task verify` (fmt + lint + check + test) before review.
