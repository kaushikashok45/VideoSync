# PIPELINE.md — the feature pipeline contract

The single source for **what each stage produces, what it may consume, and what
blocks it**. `docs/GOVERNANCE.md` owns how code rules are enforced; this document
owns how a feature gets from a request to a spec. Neither restates the other.

The pipeline exists to make bad product decisions **harder to make**. It does not
exist to produce documents. A stage that emits a polished artifact while leaving
real uncertainty unresolved has failed at its job, however good the artifact looks.

## Stages and artifacts

```
/feature "<request>"
 └─ 0. Interrogation   (main session, interactive)  → 00-brief.md   or 00-refusal.md
       ⟂ decision gate — every BLOCKING assumption and contradiction resolved
    1. pm-analyst      (cold subagent)              → 01-prd.md
       ⟂ approval gate
    2. Design triad    (cold subagents)
       2a. design-lead    → 02a-design.md + mockups/   (screens, IA, states, change inventory)
       2b. motion-lead    → 02b-motion.md              (motion language for the change inventory)
       2c. design-critic  → 02c-critique.md            (drives the prototype; tries to break it)
           ↺ revise while BLOCKING findings remain, hard cap 4 critique rounds
       ⟂ approval gate
    3. architect       (cold subagent)              → 03-hld.md
       ↰ may return BLOCKED-UPSTREAM to stage 1 or stage 2
       ⟂ approval gate
    4. implementer     (cold subagent)              → 04-spec.md, then code
       ⟂ per-commit machine gate + cold review panel
```

All artifacts live in `docs/features/<slug>/` and are **committed**. They are the
contract between stages: a stage reads its predecessors' *artifacts*, never their
reasoning. This is the same coldness principle the review panel uses.

## Stage 0 — Interrogation (interactive, not a subagent)

**Why it is interactive.** A subagent spawned via `Task` runs to completion and
cannot ask a question mid-run. Challenging a premise, forcing a decision on a
contradiction, and resolving a hidden assumption are all *dialogue*. Batch-mode
challenge means several full re-runs to converge, so the interrogation happens in
the main session where questions are possible, and only the evidence-gathering and
writing are delegated to a cold subagent.

**What it does, in order.** Each step may terminate the pipeline.

1. **Load product context** — read `docs/PRODUCT-MODEL.md` and
   `docs/DECISIONS.md`. A request that contradicts a recorded decision is
   surfaced with that decision's id before anything else happens.
2. **Challenge the premise.** Do not accept "we should add X". Establish what
   problem X solves, for whom, and where it sits in an existing workflow. A
   request that cannot survive this is refused here, cheaply.
3. **Validate the problem** — `Problem → Evidence → Hypothesis → Solution`, in
   that order. Who experiences it, how often, what happens today, what the
   friction costs, what evidence supports it, and **what evidence contradicts
   it**. Distinguish a *problem* from a *requested feature*.
4. **Detect existing solutions** against `PRODUCT-MODEL.md`'s capability list: an
   existing capability, a partial one, a configuration, a workflow workaround, or
   something that should be **extended** rather than duplicated.
5. **Extract assumptions** — every question the request leaves unstated. This is
   where most bad features hide.
6. **Detect contradictions** against the product model, prior decisions, and the
   request's own internal logic. **Never silently resolve one.** Surface it and
   get a decision.
7. **Police scope.** Classify every requirement `MUST` / `SHOULD` /
   `NICE-TO-HAVE` / `OUT-OF-SCOPE` / `UNKNOWN`, and push back on adjacent
   capabilities that are not needed to validate the core one.
8. **Resolve.** Every BLOCKING assumption and contradiction gets a human
   decision, recorded. Then write `00-brief.md`.

**Refusal.** Grounds are: no real problem; the request is already fully satisfied;
it would break existing behaviour with no acceptable mitigation; or it contradicts
a recorded decision and the requester will not overturn it. Write
`00-refusal.md` and stop.

**Partial overlap is a redirect, not a refusal** — rewrite the request as an
enhancement of the named existing capability and continue. This codebase already
carries two parallel UI kits because new work was built beside existing work
instead of into it.

## `00-brief.md` — the handoff contract

The only thing stage 1 receives beyond the standing docs. It must be complete on
its own: the subagent cannot ask a follow-up.

```markdown
# 00-brief.md — <request in one line>

- **Slug**: <kebab-slug>
- **Stage**: 0 (interrogation)
- **Verdict**: PROCEED | ENHANCE
- **Enhances**: <capability name from PRODUCT-MODEL.md, or "n/a">
- **Interrogated**: <ISO date>

## Request as received
<verbatim — later stages audit drift against this>

## Problem (validated)
- **Problem**: <stated WITHOUT naming the solution>
- **Who experiences it**: <persona from PRODUCT-MODEL.md>
- **Frequency / trigger**:
- **What happens today**:
- **Cost of the friction**:
- **Evidence for**: <each with a citation and an evidence class, see below>
- **Evidence against**: <required; "none found" is only acceptable with a reason>

## Existing-solution check
| Candidate from PRODUCT-MODEL.md | Overlap | Outcome |
|---|---|---|

## Resolved assumptions
| # | Hidden assumption | Decision | Decided by |
|---|---|---|---|

## Resolved contradictions
| # | Conflict | Resolution | Recorded as |
|---|---|---|---|

## Scope
| Requirement | MUST / SHOULD / NICE / OUT / UNKNOWN | Reason |
|---|---|---|

## Constraints carried in
<technical, product, or prior-decision constraints stage 1 must honour>

## Decisions to append to docs/DECISIONS.md
<drafted entries, human-confirmed at the gate>
```

## Evidence classes and confidence

Every significant claim in **any** pipeline artifact carries an evidence class.
The list is closed — pick one, never omit it:

`PRODUCT-MODEL` · `CODE` (with `file:line`) · `PRIOR-DECISION` (with its id) ·
`USER-STATEMENT` · `COMPETITOR` (with URL) · `DESIGN-REFERENCE` (with URL) ·
`ASSUMPTION` · `AGENT-INFERENCE`

`AGENT-INFERENCE` is **permitted and must be labelled**. An agent that presents
its own inference as a user need is the single most damaging thing this pipeline
can emit, and the label is what makes it reviewable instead of invisible.

Confidence is `HIGH` / `MEDIUM` / `LOW`, and a claim resting only on `ASSUMPTION`
or `AGENT-INFERENCE` may not be `HIGH`.

## The readiness scorecard — what gates the spec

`01-prd.md` opens with this block. **The capability sections stay empty until it
clears**, and `pipeline:check` hard-blocks a PRD whose scorecard is unresolved but
whose capability sections are populated. One file rather than two, because a
separate analysis document and PRD drift apart after the first amendment and
nothing forces them back into sync.

```markdown
## Readiness
- **Problem**: VALIDATED | UNVALIDATED
- **Existing capability**: <name, or "none">
- **Key assumptions**: <n> (<n> unresolved)
- **Contradictions**: <n> (<n> unresolved)
- **Impacted areas**: <n>
- **Risks**: <n>
- **Alternatives considered**: <n>
- **Recommended approach**: <letter + one line>
- **Out of scope**: <list>
- **Success signal**: <how we will know it worked>
- **Reversibility**: EASY | MODERATE | EXPENSIVE | NEAR-IRREVERSIBLE
- **Confidence**: HIGH | MEDIUM | LOW
- **Open decisions**: <n>
- **Status**: BLOCKED | READY
```

`Status: READY` requires: problem `VALIDATED`, zero unresolved assumptions, zero
unresolved contradictions, at least one alternative considered, a success signal,
and a reversibility rating. Anything else is `BLOCKED`, and a `BLOCKED` scorecard
with populated capabilities is a hard failure — that is the mechanism enforcing
"no polished spec before the uncertainty is resolved".

## Impact analysis — bound to reality, never invented

Impact dimensions are **derived from `docs/PRODUCT-MODEL.md`**, never from a fixed
checklist. A dimension the product does not have gets exactly one line —
`N/A — this product has no <X>` — and **no analysis**.

This rule exists because the opposite produces slop: an empty "Billing impact"
row in a product with no billing is an invitation to invent one, and invented
impact analysis is more dangerous than absent impact analysis because it reads as
diligence. Stating non-existence once is the honest, cheaper, and more useful
answer.

For every dimension the product **does** have, the question is the same: *what
does this change, and what existing behaviour could it break?* Reason
systemically, not locally.

## Failure-mode analysis

No capability is complete until its failure modes are considered. The list is
drawn from `PRODUCT-MODEL.md`'s technical constraints, and at minimum covers:
empty state, duplicate action, concurrent action by two members, partial failure,
timeout, a referenced object disappearing, stale data, page refresh mid-flow,
abandonment mid-flow, and the transport becoming unavailable.

## Alternatives, reversibility, and the lane boundary

Stage 0 and stage 1 generate **2-4 meaningfully different approaches** and
recommend one with explicit reasoning, scored on user value, complexity, risk, and
reversibility.

**These are product approaches, not implementations.** "Auto-lock the room at
capacity" vs "the host locks it manually" vs "members vote" are different
*behaviours a user experiences*. "Use a reducer instead of a store" is not — that
is the architect's decision and naming it is out of lane. Reversibility is judged
on product commitment (a user-visible contract, a data shape people come to rely
on), not on how hard the code is to delete.

## Stage 2 — the design triad

Three agents with different postures, because one agent holding all three collapses
into self-approval. **design-lead creates. motion-lead explains change.
design-critic tries to break it.**

| Agent | Consumes | Produces |
|---|---|---|
| `design-lead` | `01-prd.md`, `DESIGN.md`, `PRODUCT.md`, `PRODUCT-MODEL.md` | `02a-design.md` + `mockups/` |
| `motion-lead` | `02a-design.md`'s **change inventory**, `DESIGN.md` §Motion | `02b-motion.md` |
| `design-critic` | the **running prototype**, `01-prd.md`, `DESIGN.md`, `PRODUCT-MODEL.md` | `02c-critique.md` |

### The change inventory — why motion cannot decorate

`02a-design.md` must enumerate **every state change** in its screens: what changes,
what appears, disappears, or moves, and where it moves from and to. `motion-lead`
may animate **only** changes on that list, and must state what information each
animation communicates.

This is structural, not advisory: an animation with no corresponding change has
nothing to explain, so it cannot be justified. Motion placed after design without
this contract becomes decoration, which is the failure mode the split exists to
prevent.

### The prototype is the specification

Mockups are **self-contained runnable HTML** under `docs/features/<slug>/mockups/`
— no CDN, no external fonts, everything inlined. **Every state in the state matrix
must be reachable through visible controls**, including the real-time states. A state
matrix whose states cannot be reached is a checklist someone ticked.

The critic **drives** the prototype in a browser: tabs through it to check focus
order, triggers failure states, resizes to mobile, toggles reduced motion, reads the
accessibility tree. Most feedback and accessibility defects are invisible in HTML
source, so source review alone would systematically miss them.

### The state matrix — including this product's real states

Generic rows: initial · loading · empty · populated · error · partial failure ·
disabled · long content · overflow · mobile · keyboard focus.

**This product's rows, which no generic checklist carries** — drawn from
`PRODUCT-MODEL.md` and `DECISIONS.md`:

| State | Why it matters here |
|---|---|
| another member acted concurrently | multi-user by default; two members can act at once |
| a member joined mid-playback | they arrive into a running state, not an initial one |
| **the host disconnected — the room is ending** | `PD-002`: a room dies with its host. Terminal and unrecoverable. |
| peer connection degraded | star topology, host upstream is the bottleneck (`PD-001`) |
| drift exceeded threshold | `PRODUCT.md` names drift a first-class user-visible concern |
| **audio absent because the host has not pressed play** | `PD-008`: `captureStream` yields no audio frames while paused |
| room at capacity, join refused | server-enforced ~15 |
| control is advisory only | `PD-003`: no authenticated identity, so no permission state is trustworthy |

A design that has not addressed the host-disconnect and audio-absent rows has not
addressed this product.

### Revision loop

Critique → revise → re-critique **while `BLOCKING` findings remain, hard cap four
critique rounds.** On hitting the cap with `BLOCKING` findings surviving, halt and
report to the human: two agents that cannot converge in four rounds have found a
product question, not a design defect.

### Applicability — derived, never invented

Design dimensions come from `PRODUCT-MODEL.md`. This product has **no tables, no
bulk operations, no export, no column customisation, no search, no filters, no
pagination, no locales, and no permission states**. Those get one line —
`N/A — this product has no <X>` — and no analysis. It has three inputs in total
(name, room code, URL), so form design is scoped to those.

## Stage 3 — architecture is a gate, not a generator

`architect`'s primary question is **not** "what is the technical design?" It is:
**can this be introduced into the existing system without violating an architectural
invariant or creating future mess?**

It reports compliance against the `ARCH-<n>` invariants in `docs/GOVERNANCE.md`,
citing **each invariant's named verifier**. It may not assert `PASS` on an invariant
whose status is `UNVERIFIED` — it reports `UNVERIFIED` and states its reasoning, so
the claim is visibly an argument rather than a check.

### The pipeline is not linear — `BLOCKED-UPSTREAM`

The architect may push back on **either** stage 1 or stage 2 when a requirement is
architecturally unaffordable. It names the owning stage, the architectural cost, and
the question that needs answering.

```
              ┌── BLOCKED-UPSTREAM → stage 1 (product premise unaffordable)
architect ────┤
              └── BLOCKED-UPSTREAM → stage 2 (design needs a capability that should not exist)
```

Examples of legitimate pushback:

- Design shows live updates across every screen → *"this introduces a
  synchronisation requirement across multiple domains; is real-time actually
  required for the user problem?"* → **stage 1**.
- Design offers undo on any action → *"undo is not a presentation concern; the
  current mutation model retains nothing that would guarantee reversal"* → **stage 1**.
- A screen requires a capability that would violate `ARCH-006` by making client
  state canonical → **stage 2**.

A human decides whether to revise upstream or overrule. The architect never edits an
upstream artifact and never spawns a stage.

### Superseding existing work — a disposition is mandatory

Three capabilities in this product are `UNWIRED` or `CONTRACT-ONLY`
(`OPEN-1`..`OPEN-3` in `docs/DECISIONS.md`). The architect is **free to redesign**
them rather than adopt them — but must list **every** existing asset its design
supersedes, with `file:line` and a **disposition**:

| Disposition | Meaning |
|---|---|
| `ADOPT` | the existing asset is used as designed |
| `SUPERSEDE-AND-DELETE` | replaced, and the old asset is removed in this feature's implementation |
| `SUPERSEDE-AND-LEAVE` | replaced, old asset intentionally left — **requires a reason** |

A missing disposition is a `BLOCKING` gap. The failure mode being prevented is not a
better design replacing a worse one — it is a new mechanism landing **beside** the old
one with nobody responsible for the corpse. That is exactly how this repo accumulated
two UI kits and ~13 dead files.

### Architectural confidence

`03-hld.md` states `HIGH` / `MEDIUM` / `LOW`:

- `HIGH` — every important decision grounded in verified existing architecture.
- `MEDIUM` — some assumptions need confirmation, each named.
- `LOW` — the architecture depends on existing capabilities the agent could not
  verify.

**`LOW` blocks the gate.** An architecture resting on unverified assumptions must not
be presented as reliable, and proceeding on one is how a plan becomes a rewrite.

## Stage 4 — implementation executes the approved package

`implementer`'s principle:

> **Implement the approved design; do not reinterpret it. If implementation exposes a
> problem, stop and escalate rather than improvising.**

By this stage every product, experience, and system decision is already made and
approved. The implementer owns exactly one question: **how is the approved
architecture coded?** Anything else belongs to another stage.

### Decision ownership — the boundary that makes escalation meaningful

| Decision | Owner |
|---|---|
| What problem are we solving? | stage 0 + `pm-analyst` |
| Is it worth building at all? | stage 0 |
| What should the user experience? | `design-lead` |
| How should it look and move? | `design-lead` + `motion-lead` |
| How should the system support it? | `architect` |
| **How should the approved architecture be coded?** | **`implementer`** |
| Whether the implementation is correct | machine gate + review panel |
| Whether the requirements changed | stage 0 / `pm-analyst` |
| Whether the architecture changed | `architect` |
| Whether the UX changed | `design-lead` |

**The worst thing an autonomous implementer can do is silently make a decision that
belongs to another stage.** Escalation is not a failure mode; it is the correct
behaviour whenever the decision is not the implementer's to make.

### Escalation protocol

The implementer cannot ask a question — it is a cold subagent. So escalation means:
**keep the work, write a `BLOCKED` report, stop, and leave everything uncommitted.**

Partial work stays on disk so the human decides against real code rather than a
description of it, and the diff shows exactly where progress stopped. The report names
the **owning stage**, the decision required, and 2-3 concrete options.

Grounds to block: a missing or contradictory requirement (stage 1) · a design that
cannot be built as specified (stage 2) · an architectural gap, including *no approved
mechanism exists for something the implementation needs* (stage 3) · implementation
complexity exceeding the architect's budget.

## Verification — two layers, and nobody grades their own homework

Verification is **not** a stage of the pipeline. It is the standing gate every commit
passes, and it already exists in this project:

**Layer 1 — deterministic machine checks** (`deno task precommit`): fmt, lint, the
four structural/boundary/dumb-UI/semantics plugins, `erd:check`, `pipeline:check`,
`terminology:check`, mutation testing, and the branch-coverage floor — all scoped to
the governed diff (D1).

**Layer 2 — the cold review panel** (`/review-now`), five independent subagents with
no session history, aggregated **OR-blocking**:

| Reviewer | Lens |
|---|---|
| `reviewer-correctness` | logic bugs, off-by-one, error and edge paths, ERD invariant violations |
| `reviewer-architecture` | Tier 3 only — ISP, premature abstraction, whether a name is *correct*, `useRef`-as-state |
| `reviewer-contracts-tests` | contract fidelity, the five coverage categories, mutation adequacy, whether a named test *proves* its invariant |
| `reviewer-security-concurrency` | `ARCH-004` room isolation, `ARCH-005` trust boundaries, races, capacity, payload trust |
| **`reviewer-design-fidelity`** | **does the built feature match the approved prototype** — states, behaviour, accessibility, and visual divergence, checked by driving both in a browser |

`reviewer-design-fidelity` closes the Design→Code loop. It loads the approved
prototype and the running implementation at matching viewports and reports divergence
by inspection. **There are no stored screenshot baselines** — the comparison is
browser-driven and human-legible, not pixel-exact, and it is honest about that rather
than pretending to a precision it does not have.

## `pipeline:check`

Deterministic, no LLM. Shares its reference-binding module with `erd:check` —
both parse structured ids out of markdown and resolve them across files, and both
must **fail loudly** on a non-literal `Deno.test` name rather than pass silently.

It enforces:
- `00-brief.md` exists and its verdict is `PROCEED` or `ENHANCE` before
  `01-prd.md` may exist.
- A `BLOCKED` readiness scorecard with populated capability sections → **fail**.
- Every `CAP-<n>` in `01-prd.md` is accounted for by `02a-design.md` (a screen) and
  `03-hld.md` (a slice) — **all phases**.
- Every `CAP-<n>` in the **active phase** is accounted for by a named test in
  `04-spec.md`, and that test name resolves to a real `Deno.test("<literal>"`.
- Every capability carries a `**Phase**`, and `## Delivery phases` accounts for
  each exactly once.
- Every significant claim carries a closed-list evidence class.
- A stage artifact exists only if its predecessor is marked `**Approved**: yes`.

Later-phase capabilities are exempt from the test requirement only — design and
HLD must cover the whole end state, or a later phase arrives with nowhere to live.
