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

## 2. Linter configuration (`deno.json`)

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

## 3. Code smells the reviewer must look for

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

## 4. Reviewer mandate

- A **secondary reviewer agent** runs after every task in the implementation plan.
- The reviewer is a *fresh, independent pass* — it does not implement; it only reviews and
  reports.
- The reviewer checks: §1 size limits, §3 smells, FSD layer rules, Tell-Don't-Ask, SOLID
  adherence, error-model compliance, and test coverage depth (all five categories).
- Findings are reported as blocking vs non-blocking. Blocking findings must be fixed before
  the task is accepted; non-blocking findings are logged as follow-ups.
- The reviewer never silently fixes — it reports; the implementer fixes.

## 5. PR granularity

- Work is grouped into **feature-sized PRs** (all entities, then all features, then wiring),
  each PR small enough to review in one sitting.
- A PR is **rejected** if it exceeds ~300 changed lines or touches more than ~6 files, or if
  it mixes unrelated concerns (e.g. a bug fix inside a feature PR).
- The reviewer refuses to review oversized PRs and requests a split before proceeding.
- Each PR must pass `deno task verify` (fmt + lint + check + test) before review.
