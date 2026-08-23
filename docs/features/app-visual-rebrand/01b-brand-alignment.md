# 01b-brand-alignment.md — App-Wide Visual Rebrand, Starting from the Landing Page

- **Slug**: app-visual-rebrand
- **Stage**: 1b (Brand Strategist)
- **Strategy version checked against**: 1.0
- **Approved**: no

## Per-capability check

| CAP | Invariant(s) checked | Verdict | Notes |
|---|---|---|---|
| CAP-1 — Attractive, benefit-selling landing experience | `INV-3` (no implied flawless/functioning sync), `INV-4` (anti-slop is brand-level), `INV-5` (warmth without cutesy), `INV-6` (content stays center) | CLEAR | `AC-1.2` already forbids imagery depicting synchronized multi-device playback "in action" — this is exactly `INV-3` and the PRD arrived at it independently. No conflict. The PRD's "hyperrealistic imagery/experimental typography" direction is unconstrained by anything here except `INV-4`/`INV-5`, which bind the *execution* stages (`creative-director`, `visual-designer`, `design-lead`), not this PRD's capability language. |
| CAP-2 — Persistent branded header and footer on every screen | `INV-1` (no implied persistence), `INV-2` (no implied enforced permission), `INV-6` (chrome supports, never competes with, the watched content) | CLEAR | `AC-2.4` retires room-scoped actions (invite, room code) once the room ends — consistent with `INV-1`/`PD-002`'s ephemerality. The PRD's own flagged coexistence risk (footer vs. reaction tray/bottom capsule) is a design-execution question for `design-lead`, not a brand conflict — `INV-6` states the principle design-lead must satisfy, it does not block the capability itself. |
| CAP-3 — New visual system applied to room identity, setup, source-selection, readiness, and the player | `INV-4` (anti-slop is brand-level, independent of token values), Strategic Guardrails (marketing/UI language stays within what is wired) | CLEAR | This capability replaces token *values* only (`AC-3.1`), which is squarely `PD-021`'s and `visual-designer`'s territory, not brand-strategist's. See resolution below for the PRD's own flagged open question about scope. |

## Resolution of the PRD's "Identity reconciliation" open question

The PRD (`01-prd.md`, "Identity reconciliation") correctly declines to decide,
on its own, whether `PD-021`'s supersession of `DESIGN.md`'s dark-cinema system
also supersedes `DESIGN.md`'s anti-slop rules of thumb (no glassmorphism, no
gradient text, the AI-slop checklist). That is a brand-territory question, and
this stage resolves it:

**The anti-slop rules of thumb survive `PD-021` and bind this feature.** They
are now written into `docs/BRAND-STRATEGY.md` as `INV-4` — a **brand-level**
invariant, not a token-level one. Reasoning:

- `PD-021`'s own text scopes its supersession to "`DESIGN.md`'s current tokens"
  and "concrete visual execution" — colour, typography, layout values. The
  anti-slop rules of thumb (no glassmorphism, no gradient text, no side-stripe
  borders, no uppercase-tracked eyebrows, the generic-SaaS/AI-slop checklist)
  describe **decorative and compositional patterns**, not palette values. A
  totally different colour system could still commit every one of these
  mistakes; the rules would still forbid it. They are not "part of the
  dark-cinema token system" `PD-021` names — they are independent of any
  specific token set.
- `docs/PIPELINE.md`'s own brand-strategist workflow instructs this stage to
  define "anti-positioning specific to this category's traps (generic SaaS
  chrome, gamer aesthetic, AI-slop gradients, watch-party feature-brochure
  marketing)" as a standing part of the brand strategy — meaning this
  question was always going to resolve at this stage, not later, regardless of
  which way `PD-021` cuts on tokens.
- Treating the anti-slop rules as *superseded* would mean `PD-021` — a decision
  about not liking the current palette's "attractiveness" — accidentally
  authorizes reintroducing exactly the generic, decoration-for-its-own-sake
  patterns the stakeholder's own brief is trying to escape. That reading
  produces a worse outcome than the one `PD-021` was trying to fix.

**Practical effect on downstream stages**: `visual-designer` may propose an
entirely new palette, typographic system, and token set under `PD-021`. It may
**not** propose glassmorphism, gradient text, decorative gradients, uniform
rounded-card grids, unexplained illustration, or generic "premium SaaS" chrome
under cover of "the token system is now open." Any visual-designer artifact
that reintroduces these patterns is a brand conflict requiring
brand-strategist review per `INV-4`'s own text, not a legitimate exercise of
`PD-021`.

This is not a change to an *existing* `docs/BRAND-STRATEGY.md` (none existed
before this run), so no separate Decision Log confirmation is required beyond
what is already recorded in `docs/BRAND-STRATEGY.md`'s own Decision Log (v1.0,
second row).

## Conflicts requiring a decision

None. All three capabilities are `CLEAR` against the Strategic Invariants and
Associations to Avoid. The one genuine ambiguity in the PRD (the anti-slop
scope question) is resolved above rather than surfaced as a blocking conflict,
because resolving it is this stage's job, not a cross-stage disagreement
requiring a human tiebreak — a human should still confirm this resolution
alongside confirming `docs/BRAND-STRATEGY.md` itself moving from `REVIEW` to
`APPROVED`.

## Proposed Decision Log entries

None beyond what `docs/BRAND-STRATEGY.md`'s own Decision Log already records
(v1.0). This feature changes no standing strategy — it is the first consumer of
it.

## Verdict

CLEAR
