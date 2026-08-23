# 01d-creative-direction.md — App-Wide Visual Rebrand, Starting from the Landing Page

- **Slug**: app-visual-rebrand
- **Stage**: 1d (Creative Director)
- **Approved**: yes (2026-08-22) — Territory 2 "The Console" and the DESIGN.md delta scope (§18) both confirmed
- **Revision**: 2 — supersedes the prior artifact in full, per `PD-023`

## 00. Why This Is a Revision, Not an Edit

The prior run's posture was: `DESIGN.md`'s dark-cinema system already carries
every screen; the only genuine gap is landing photography. The requester
rejected that outright — "the existing design system is crap" — and `PD-023`
confirms the rework is not confined to colour/typography/photography. It
extends to `DESIGN.md`'s **structural conventions**: the stage/overlay layout
model, the 8pt spacing scale, the semantic z-index scale, and the existing
component visual patterns (`Card`/`Button`/`TextField`/`Popover`/
`PlayerShell`). This document treats none of those as a fixed baseline. It
generates genuinely distinct structural territories for the whole system,
evaluates them with the same rigor the prior run applied to photography alone,
and selects one.

**What this document does not reopen** (per `PD-023`'s own text and this
stage's ownership boundary): `docs/BRAND-STRATEGY.md`'s positioning,
personality, and `INV-1`–`INV-6` (including `INV-4`'s anti-slop guardrails —
no glassmorphism, no gradient text, no generic-SaaS card grids — which bind
at brand level, independent of whatever structural system wins here);
`01c-page-strategy.md`'s architecture (no new route, no IA change, the
per-screen editorial-landing/conventional-elsewhere resolution of Brand
Tension #1, the persistent-elements and composition-anchor requirements —
video anchors the player, room code/identity stays stable and visible,
header/footer are one consolidated component with a contextual slot);
`PRODUCT.md`'s brand-personality words, its approved wordmark concept ("Sync"
semibold / "Party" lighter, Avenir-style), and its accessibility commitments.

## 01. Creative Summary

The prior direction under-delivered because it treated "extend the system"
as the answer before asking whether the system's *structure* — not just its
palette — was actually serving this product. Re-examined structurally,
`DESIGN.md`'s stage/overlay model (floating chrome, raised/sunken surface
elevation, card-and-shadow components) is a generic "dark dashboard" shape
that happens to have a cinema palette painted on it — it is not, on its own,
distinctive, and it is exactly the kind of shape `docs/BRAND-STRATEGY.md`'s
Brand Anti-Positioning names ("generic SaaS chrome... sidebar-plus-gray-card
dashboards"). This document proposes three structurally distinct territories
for the whole system — not three palettes — evaluates them against the
product's actual constraints, and selects one: a **flat, anchored,
hairline-bounded system** that replaces floating/elevated chrome with chrome
that reads as *built into the room*, not laid over it. The landing hero's
photography direction from the prior round is carried forward largely
unchanged, because the requester's rejection was of the structural
extend-only posture, not of that specific sub-decision — it is
re-evaluated against the new structural winner in §08, not silently reused.

## 02. Selected Creative Thesis

Nothing in this product floats. Chrome, cards, fields, and panels are not
translucent surfaces raised above a dark void — they are flat, hairline-edged
elements built directly into the room, the way a projection booth's controls
are recessed into its own wall rather than resting on top of it; only the
video and, once, the landing hero photograph are ever allowed to look like
they are lit from within.

## 03. Alternative Territories Considered

Genuine divergence is warranted here per `PD-023` — the prior run's own
default-extend posture on the *structural* system is precisely what was
rejected. Three structurally distinct territories were generated, each
differing in layout model, spacing rhythm, type-scale behaviour, and
component visual language — not merely in accent colour.

### Territory 1 — "The Aperture" (framed-boundary system)

Every screen composes its content inside a deliberately visible frame: a
thin hairline edge marks the boundary between "the room" (chrome, negative
space) and "what's being shown" (video, hero photograph, media preview,
even a room-identity card). The overlay concept DESIGN.md already uses only
for the player extends everywhere: the frame, not elevation, is the
compositional unit. Rhythm follows cinema-aspect-ratio proportions
(1.85:1 / 2.39:1-influenced section proportions) for major composition, not
a single linear spacing step. Components: `Card`/`Popover` become
hairline-outlined apertures rather than filled, shadowed surfaces; `Button`
splits into one filled primary and an inline-etched (bordered, not filled)
secondary; `PlayerShell`'s existing frame becomes explicit — a visible edge
around the video, like a projector's throw, rather than a borderless
full-bleed rectangle.

### Territory 2 — "The Console" (flat, anchored-chrome system)

Chrome stops floating. `01c-page-strategy.md` has already established, as a
product fact and not a stylistic choice, that header/footer behave
differently from the bottom-center capsule and reaction tray: the former are
persistent and idle-immune (`PD-022`, `AC-2.2`), the latter auto-hide
(`use-idle-visibility.ts`). This territory gives that existing mechanical
split a matching *visual* language for the first time: header/footer read as
anchored, architectural elements — built into the layout the way a
console's transport bar is built into its own housing — while the capsule
and reaction tray keep the current overlay/reveal-on-interaction visual
language, because they are the thing that actually recedes. Surfaces flatten:
the current four-step elevation scale (`bg`/`surface`/`surfaceRaised`/
`surfaceSunken`) collapses toward two roles — the room, and a bounded panel
distinguished by a hairline, not a lighter fill or a shadow. Spacing tightens
on instrument-like chrome (denser, more uniform steps) while the landing
hero keeps an expansive editorial rhythm — two registers, not one blurred
compromise. Typography's existing restricted-mono role (room codes, technical
values) expands to carry more of the UI's state language (readiness,
connection, sync status), reinforcing precision. Components: `Card`/
`TextField`/`Popover` move from filled-surface-plus-shadow to flat panel
plus hairline border; `Button` keeps one filled primary, but its secondary
form drops the current `surface`-plus-`borderStrong` look for a plainer
outlined form; `PlayerShell` is explicitly **not** touched by this territory's
"anchored, non-floating" idea — the video's overlay chrome (capsule, tray,
and the header/footer specifically *on the player*) stays exactly what
`01c-page-strategy.md` mandates: overlays relative to the video, never a
competing region. The territory's claim is about visual language (flat,
architectural, non-elevated) applied everywhere chrome is *not* required by
locked architecture to be an overlay; it does not relitigate what counts as
an overlay on the player.

### Territory 3 — "The Vestibule" (asymmetric editorial-column system)

Composition on every screen (not just the landing hero) adopts an
intentionally asymmetric two-track layout at a fixed, unusual ratio (closer
to 2:5 than a balanced half-and-half), echoing a foyer you pass through
before entering the room proper: one track is always the task/decision
content, the other is always room identity/context, at the same ratio site-
wide rather than `DESIGN.md`'s current ad hoc primary-workspace/secondary-
context split. Spacing for major composition follows a 2:3-ratio modular
scale rather than uniform linear steps; micro-control spacing stays 8pt-
compatible. Typography leans more aggressively editorial everywhere, not
just on the landing hero — larger display sizes and wider measure variation
on every heading. Components largely keep their current elevation model;
the divergence here is compositional and typographic, not surface-level.

### Evaluation

| Territory | Brand fit | Page fit | Product fit | Distinctiveness | Craft potential | Scalability | Derivation risk |
|---|---|---|---|---|---|---|---|
| 1 — The Aperture | Medium-High — "a room of its own" pairs naturally with a frame motif, but risks reading as a "cinema" costume (film-strip/frame clichés) rather than an earned structural idea if not executed with restraint | High — the frame device literalizes `INV-6` (chrome supports, never competes) everywhere, not only on the player | Medium — asks for a new spatial idea (explicit frames on every screen) the product has never used, higher execution risk than adapting an existing split | High — a consistent visible-frame compositional unit is genuinely uncommon outside actual cinema-adjacent products | High — very buildable, but the "torn ticket / film strip" adjacent decoration this idea invites sits close to `DESIGN.md`'s own named anti-pattern ("decorative film grain") and must be actively resisted | Medium — extends cleanly to new marketing surfaces, less cleanly to dense, non-visual task UI (a form field is not naturally "an aperture") | Medium — cinema-frame-as-UI-motif is a real design mechanism, but close enough to literal film iconography that a careless execution reads as theme, not idea |
| 2 — The Console | High — "plainspoken" (precision, no decoration masquerading as trust) and "cinematic" (composed, unhurried, the content stays dominant) both map directly onto flat/anchored/non-elevated chrome | High — the visual language is *derived from*, not merely compatible with, a mechanism `01c-page-strategy.md` already locked in (the two-tier chrome-visibility split); it does not invent a new idea, it finishes one already started | High — the persistent-vs-idle-hiding chrome split is a real, current product fact (`PD-022`, `AC-2.2`); giving it a visual identity is the least invented of the three territories | High — most watch-together competitors and generic dark-mode SaaS both default to floating/elevated chrome over content; an explicitly non-floating, architectural chrome is a genuine structural departure from category default | High — flat/hairline systems have an unforgiving craft bar (every alignment and hairline shows), which is exactly the kind of constraint that produces a considered, non-generic result rather than one that hides behind gradients | High — the flat/anchored language and the tightened instrument-spacing register extend to any future screen or component without redesign | Low — motivated by an existing, already-decided product mechanism rather than a borrowed aesthetic; the risk is under-differentiation from "flat design" generally, not overclaiming a borrowed reference |
| 3 — The Vestibule | Medium — the asymmetric-column idea does express "considered, unhurried" but has no particular tie to any of the five personality traits beyond generic editorial confidence | Medium-Low — a fixed sitewide column ratio conflicts with `01c-page-strategy.md` §08's own instruction that composition follows "primary workspace/secondary context/preview/action" **roles**, which vary in proportion by screen need, not a single fixed ratio; risks contradicting locked page-strategy rather than extending it | Low-Medium — most of this product's task screens (setup, source-selection, readiness) are short, single-decision forms; forcing a fixed asymmetric two-track layout onto them where one track is often nearly empty (landing has no room context, the player has no "column" concept at all) produces awkward, unmotivated whitespace on several of the five routes | Medium — asymmetric editorial grids are common in modern marketing sites; distinctiveness here rests entirely on the specific ratio and discipline of using it everywhere, which is harder to sustain than to state | Medium — attractive on paper, but the player and landing don't naturally have a "second column" at all, forcing `design-lead` to invent one to keep the ratio consistent — decoration in service of a rule, not a product need | Low-Medium — a fixed ratio is brittle: content that doesn't fit either track (the player's overlay chrome, for one) has to be exempted, and once one screen is exempted the "sitewide ratio" claim stops being true | Medium — magazine/editorial grid layouts are a well-worn reference; without deep restraint this reads as "we made it a magazine," a substitution-test failure |

**Winner: Territory 2 — The Console.**

## 04. Why This Direction Wins

- **It is discovered, not invented.** `01c-page-strategy.md` already
  established, as a locked product fact, that header/footer behave
  differently from the capsule/reaction tray (persistent vs. idle-hiding,
  `PD-022`, `AC-2.2`). Territory 2 is the only one of the three whose
  structural idea *is* that existing mechanism, given a visual language for
  the first time — the lowest derivation risk of the three because nothing
  about it is borrowed from an unrelated reference.
- **It directly answers what `PD-023` actually asked.** The requester named
  the stage/overlay layout model, the component visual patterns, and the
  z-index scale as open. Territory 2 changes exactly those things — from
  floating, elevated, shadowed surfaces to flat, hairline-bounded, anchored
  ones — while Territory 1 changes composition units and Territory 3 changes
  column ratios; only Territory 2 touches the specific structural
  conventions named in the decision.
- **It survives the AI-slop test by construction.** Flat, hairline,
  non-elevated components are the structural opposite of glassmorphism,
  gradient fills, and floating-card decoration — the winning territory does
  not need a rule bolted on to avoid these patterns, it is incompatible with
  them by definition.
- **It resolves Brand Tension #1 without new risk.** `docs/BRAND-STRATEGY.md`'s
  CRITICAL risk is visual polish implying a fidelity (flawless sync,
  enforced permission) the product doesn't have. A flat, unshadowed,
  hairline-precise system reads as *built and honest*, not *dressed up* —
  the same resolution the prior photography choice reached for imagery, now
  reached structurally.
- **It has the lowest execution risk of the three at the anti-pattern
  boundary.** Territory 1's frame motif risks tipping into literal cinema
  costume (film-strip/ticket-stub decoration `DESIGN.md` already names as an
  anti-pattern); Territory 3 risks contradicting `01c-page-strategy.md`'s own
  locked per-screen composition-role instruction. Territory 2 does neither.

## 05. Layout & Composition Direction

- **Structural model, restated**: chrome is either *anchored* (built into
  the room, non-floating, applies to header/footer everywhere they are not
  mandated to be an overlay) or *overlay* (floats above the video, applies
  only to the player's capsule, reaction tray, and — on the player
  specifically — the header/footer, per `01c-page-strategy.md`'s locked
  invariant). These are two different visual languages for two different,
  already-decided behaviours — not a stylistic inconsistency.
- **Header/footer, non-player routes** (landing, room identity/setup,
  source-selection, readiness): read as part of the page's own structure —
  a hairline divider separates them from the body, not a raised bar sitting
  on top of it. Same component, same weight, everywhere; only the contextual
  actions slot varies, exactly as `01c-page-strategy.md` §06/§09 requires.
- **Header/footer, player route**: unchanged from the locked architecture —
  overlays relative to the video, appearing and receding per `PD-022`'s
  fullscreen rule. `design-lead` should still express these in the flat,
  hairline visual language (no shadow, no elevation) so the *component* reads
  as the same object in both contexts even though its *layering behaviour*
  differs by route.
- **Landing hero**: the photograph remains the structural anchor exactly as
  the prior round established (§08) — headline, supporting line, and both
  CTAs form a restrained typographic block placed against the image, never
  inside a floating card. This is untouched by the structural territory
  change because it was never a "chrome" element to begin with.
- **Landing benefit section**: stays text-led, not an icon-card grid — under
  Territory 2, if any bounded panel is used at all here, it is a flat,
  hairline-edged block, never a shadowed or filled card, consistent with the
  collapsed elevation model (§07).
- **Room identity/setup/source-selection/readiness**: the existing
  primary-workspace/secondary-context role split from `01c-page-strategy.md`
  §08 is preserved exactly — this document does not touch the *role*
  assignment, only the *visual treatment* of the panels expressing those
  roles (flat/hairline rather than filled/shadowed).
- **Player**: video remains the sole anchor at all times; capsule, tray, and
  (on this route only) header/footer are overlays, unchanged from
  `01c-page-strategy.md` §08 and `INV-6`.

## 06. Typography Direction

The existing three-role system (Avenir-style wordmark, system-sans UI,
restricted monospace) stays exactly as `PRODUCT.md`/`DESIGN.md` define it —
the wordmark concept is authoritative per `PD-021`'s own consequences and is
not open to this stage.

- **Two typographic registers, not one compromise scale.** Landing keeps the
  expansive editorial register the prior round already justified for the
  hero headline (§17 of `01c-page-strategy.md`'s own "SHOULD explore"). Every
  other screen's chrome and task UI adopts a tighter, more uniform register
  — this is the structural typographic delta Territory 2 asks for: the
  instrument reads as precise and unadorned specifically because its type
  scale does not reach for editorial drama the way the landing hero does.
  This is a rhythm/relationship instruction, not a new size table —
  `design-lead` sets the actual scale values.
- **Expanded monospace role.** Beyond room codes and technical metadata, the
  monospace role may now also carry short state labels (readiness,
  connection, sync status) throughout the task screens and player — a
  deliberate reinforcement of "plainspoken, precise" that fits the flat
  instrument language. This does not touch headings, body copy, or the
  wordmark, and it must not become a decorative substitute for the system
  sans on running text.

## 07. Colour Direction

No new token is invented here; the existing roles carry the flat system with
one structural implication stated plainly:

- **The elevation ladder compresses.** `DESIGN.md`'s current four-step
  surface model (`bg`/`surface`/`surfaceRaised`/`surfaceSunken`) exists to
  simulate depth for a raised-card system. A flat, hairline-bounded system
  needs fewer distinct fills and more reliance on a border role to separate
  regions — this is a genuine structural implication of Territory 2, not a
  cosmetic preference, and `design-lead`/`visual-designer` should treat "how
  many distinct surface fills does a flat system actually need" as an open
  design decision rather than assuming the current four survive unchanged.
- **`brand` red (or whatever hue `visual-designer` ultimately proposes under
  `PD-021`) stays the single saturated accent.** Nothing about the flat
  structural system changes DESIGN.md's own rule of thumb that a second
  saturated colour signals the design is off course — that rule is
  independent of elevation model and survives regardless of which territory
  won.
- **`ink`/`inkMuted`/`inkFaint` hierarchy**: unchanged in role; a flat system
  actually needs this hierarchy to work harder, since it can no longer lean
  on a lighter "raised" fill to imply "this is the active/foreground thing" —
  contrast and hairline placement do that work instead.

## 08. Image / Media Direction

**Carried forward from the prior round, re-evaluated against the new
structural winner rather than silently reused**, because the requester's
rejection was of the extend-only posture on structure, not of this specific
photography decision: the landing hero is a photograph of a person, or small
group, watching something, lit only by the motivated glow of their own
screen or a lamp — never posed toward camera, no added studio light, no
color-graded gradient laid over it, no screen content or multi-device sync
ever visible in frame (`AC-1.2`, `INV-3`).

**Why this still holds under Territory 2**: a flat, unshadowed, hairline
system is the structural expression of "plainspoken" honesty; motivated-light
documentary photography is the *photographic* expression of the same trait.
The two reinforce each other rather than merely coexisting — an honest,
unadorned structural system paired with a staged, glossy "film still" hero
(the direction rejected in the prior round for a different reason) would now
also be an internal contradiction between the system's structural character
and its one photographic moment, which is an additional reason, specific to
this revision, to keep documentary candid over the previously-rejected
staged and fragment alternatives.

**What changes under this revision**: nothing in the image direction itself.
The frame the photograph sits within (§05) is now explicitly *not* a card —
under the collapsed elevation model, the hero image has no shadow, no raised
panel behind it; it is full-bleed content with a flat typographic block
placed against it, consistent with how every other flat panel in the system
now behaves.

## 09. 3D / Spatial Direction

Not applicable — nothing in `01c-page-strategy.md`'s experience mode calls
for a spatial or 3D treatment on any of the six screens, and Territory 2's
"flat" idea is a 2D structural claim (no elevation, no depth simulation), not
an invitation to add dimensionality anywhere.

## 10. UI + Creative World

Landing still reads as an **invitation** — a publication's cover moment —
exactly as the prior round established; that is locked by
`01c-page-strategy.md`'s editorial/conventional split and unaffected by this
revision. What changes is what the visitor is invited *into*: previously, a
dark-cinema dashboard with raised cards and floating chrome; now, a
**precision instrument** — quiet, flat, exact, built rather than laid over.
The metaphor is not a mixing console's aesthetic borrowed for its own sake;
it is the honest visual expression of what the product actually is
end-to-end: a small, exact tool for a few people, not a streaming platform's
busy shelf-and-badge chrome (`PRODUCT.md`'s own anti-reference) and not a
generic SaaS dashboard (`docs/BRAND-STRATEGY.md`'s anti-positioning).

## 11. Interaction & Motion Expression

Quiet, precise, immediate — carried forward from the prior round's motion
character, with one structural adjustment: a flat system has no "raised
surface" to lift on hover, so hover/focus/pressed feedback expresses through
hairline-border emphasis and small position/opacity shifts rather than a
surface-elevation change. This is character-level guidance for `motion-lead`,
not a timing or easing specification — `01c-page-strategy.md` §18 already
fully resolves what is essential/supporting/optional for this feature; this
document only notes that the *mechanism* motion expresses through changes
(border emphasis, not elevation), because Territory 2 removed elevation from
the system.

## 12. Creative Signature

Two things, specific to this feature:

1. **The founding-scene photograph** — DESIGN.md's own "Scene" paragraph,
   photographed for the first time (carried forward, §08).
2. **Flat, anchored chrome with an expanded monospace state-language role** —
   the structural signature this revision produces: chrome that is built
   into the room rather than floating over it, and state language (sync,
   readiness, connection) rendered in the same restrained monospace already
   reserved for room codes, reinforcing precision as a felt quality
   throughout the product, not only on the landing page.

Everything else — the single saturated accent, the wordmark treatment, the
video-as-stage principle on the player — remains the product's existing
signature, borrowed rather than reinvented.

## 13. Anti-Patterns Rejected

- **Territory 1 (The Aperture) and Territory 3 (The Vestibule)** — rejected
  as whole territories per §03/§04, not merely as decoration choices within
  the winner.
- Floating, shadowed, elevated card language as the default for every panel
  — the specific structural pattern this revision replaces.
- Gradient hero / "dark background + neon gradient" (named in `01-prd.md`'s
  own research; carried forward, not re-litigated).
- Staged, studio-lit "film still" hero — rejected in the prior round and
  reaffirmed here as additionally inconsistent with the flat system's own
  honesty (§08).
- Generic AI-generated or stock "diverse people smiling at a laptop"
  imagery.
- Icon-card grid for the benefit section.
- Glassmorphism, gradient text, decorative uppercase eyebrows, side-stripe
  borders (`INV-4`, binding regardless of structural or token changes).
- A persistent/sticky landing CTA, scroll-jacking, a sixth marketing route,
  or a uniform single visual mode across all six screens — all rejected by
  `01c-page-strategy.md` §19 with reasons; not reopened here.
- Film-strip/ticket-stub/perforation decoration as a literal "cinema" motif
  — the specific failure mode Territory 1 risked and this document declines
  to inherit even as a decorative accent on the winning territory.

## 14. Deliberate Exclusions

Inherited from `01c-page-strategy.md` §19, not re-decided: no sticky/
persistent landing CTA; no scroll-jacking; no sixth route; no uniform visual
mode across all six screens.

Added by this revision:
- **A fixed sitewide asymmetric column ratio (Territory 3) excluded** —
  conflicts with `01c-page-strategy.md` §08's per-screen composition-role
  instruction, and several routes (landing, player) have no natural "second
  column" to force into the ratio.
- **An explicit cinema-frame motif on every screen (Territory 1) excluded**
  — the player already owns a legitimate frame/stage concept; extending a
  literal visible frame everywhere risks reading as costume rather than
  structure, and Territory 2 achieves the same "chrome supports, never
  competes" goal without the frame's decorative risk.
- **A literal mixing-console skeuomorphic aesthetic (knobs, faders, LED
  meters) excluded** — the instrument metaphor is structural (flat, anchored,
  precise) not decorative; rendering it literally would itself become the
  kind of "unexplained illustration"/decoration `INV-4` forbids.

## 15. Design Lead Brief

**MUST establish**
- The flat, hairline-bounded panel language for `Card`/`TextField`/
  `Popover` — no elevation shadow, no raised/sunken fill distinction beyond
  what's needed for genuine reading-order clarity (§05, §07).
- Header/footer as anchored, non-floating structure on every non-player
  route, and as overlays (in the same flat visual language) on the player
  specifically — this split is deliberate, not inconsistent (§05).
- The hero photograph as a real, motivated-light image, full-bleed with no
  card/shadow framing behind it (§08).
- A text-led benefit section that is not an icon-card grid (§05, carried
  forward).

**MUST preserve**
- `INV-4`'s anti-slop guardrails regardless of how new the structural system
  is.
- `PRODUCT.md` Principle #1/#11 and `01c-page-strategy.md`'s locked
  composition anchors — the video is the stage on the player, unconditionally.
- The existing primary-workspace/secondary-context/preview/action role
  structure on all task screens (§05) — this document changes the panels'
  *visual treatment*, not their *role assignment*.
- Room code/identity as a stable, unmissable element from `SetupScreen`
  through the player.
- The wordmark concept (Avenir-style, "Sync" semibold / "Party" lighter) —
  not open to this stage or this revision.

**MAY explore**
- How many distinct surface-fill roles a flat system actually needs, given
  the collapsed elevation model (§07) — an open design decision, not
  resolved here.
- The tighter instrument-spacing register for chrome/task UI versus the
  expansive editorial register for the landing hero (§06) — a relationship,
  not a value table.
- Whether the expanded monospace role for state language (§06, §12) extends
  usefully to all five task screens or reads better scoped to the player and
  readiness screens specifically.
- A hover/focus mechanism appropriate to a system with no elevation to lift
  (§11) — border emphasis, underline, or another mechanism `design-lead`
  judges best.

**MUST NOT become**
- A generic flat SaaS dashboard (the same anti-positioning risk any flat
  system invites) — differentiate through the single accent, the wordmark,
  the photograph, and the "anchored, not merely borderless" chrome logic,
  not through decoration.
- A literal skeuomorphic console (knobs, meters, faders) — the instrument
  idea is structural, not illustrative (§14).
- A staged, studio-graded "film still" hero, generic AI/stock "premium
  SaaS" imagery, or any glassmorphic/gradient-text/icon-card-grid execution.
- A header/footer that competes with the video for visual dominance on the
  player, or that abandons the player's locked overlay behaviour in favor of
  the anchored language used elsewhere.

## 16. Motion Design Brief

`01c-page-strategy.md` §18 already fully resolves essential/supporting/
optional motion for this feature; nothing here is essential motion by the
strict "information inaccessible without it" test, and this document does
not reopen that finding. Two things specific to this revision:

- **Motion must never** apply any animation to the hero photograph that
  could make it read as moving/live footage (carried forward from the prior
  round — still applies unchanged under Territory 2).
- **Motion must express state changes through border/opacity emphasis, not
  elevation change**, now that the flat system has no raised surface to lift
  on hover, focus, or press (§11). This is a character constraint on
  *mechanism*, not a timing or easing specification — `motion-lead` still
  owns duration, curve, and exact transition mechanics.

## 17. Implementation Priorities

- **ESSENTIAL**: the flat, hairline panel language replacing elevated/
  shadowed surfaces on `Card`/`TextField`/`Popover` (§05, §07); the
  anchored-vs-overlay header/footer split by route (§05); the hero
  photograph as motivated-light, real-subject imagery (§08); the text-led
  benefit section; token/imagery replacement on room identity/setup/source/
  readiness/player consuming the (revised) semantic roles.
- **IMPORTANT**: resolving how many distinct surface-fill roles the flat
  system needs (§07, §15); the two-register typographic relationship (§06);
  resolving the player-footer/capsule coexistence question (carried forward
  unresolved from `01c-page-strategy.md` §22).
- **OPTIONAL**: the expanded monospace state-language role beyond room
  codes (§06, §12) — valuable but not required for this feature's
  acceptance criteria; any micro-interaction on the landing CTA beyond the
  existing `Button` component's states.
- **DECORATIVE**: none proposed. Consistent with `INV-4` and `DESIGN.md`'s
  own "if a visual element does not clarify the task, state, or brand,
  remove it" — the flat system's entire premise is the absence of
  decoration standing in for structure.

## 18. DESIGN.md Delta

This is a larger delta than the prior round's, per `PD-023`. All of it is
proposed, none of it is final — every item below still requires the
existing human confirmation gate (pipeline stage 14) before `DESIGN.md`
itself is edited.

> **Layout — elevation model (replaces the current stage-model surface
> ladder for non-player chrome)**: chrome, cards, fields, and panels outside
> the player's overlay elements are flat and hairline-bounded, not raised or
> shadowed. The current `surface`/`surfaceRaised`/`surfaceSunken` roles are
> re-examined for how many distinct fills a flat system actually needs
> (`design-lead` to determine the count; this delta does not fix a number).
> The player's existing overlay/stage model — video anchored, capsule/tray/
> header/footer as overlays that appear and recede — is **unchanged** and
> explicitly exempted from this delta.
>
> **Layout — chrome anchoring**: header/footer are structurally anchored
> (part of the page's own layout, separated from body content by a hairline,
> not a floating bar) on every route except the player, where they remain
> overlays per the existing `PD-022` amendment to Principle #1.
>
> **Typography — two registers**: the display/editorial register (currently
> used only implicitly) is now explicitly scoped to the landing hero; every
> other heading and UI text uses a tighter, more uniform register. The
> restricted monospace role may extend to short state labels (readiness,
> connection, sync status) beyond room codes and technical metadata.
>
> **Components**: `Card`/`TextField`/`Popover` move from filled-surface-plus-
> shadow to flat panel plus hairline border. `Button`'s secondary form moves
> from `surface`-plus-`borderStrong` to a plainer outlined form. `PlayerShell`
> is unchanged.
>
> **Photography** (new section, carried forward from the prior round): when
> this product uses real photographic imagery, it depicts a subject lit only
> by the motivated glow of a screen or lamp — no added studio light, no
> color-graded gradient overlay, no visible screen content, no AI-generated
> human subjects. Reality level: hyperreal-but-plausible, never a produced
> "film still."
>
> **Z-index**: the semantic scale itself (`overlay → dropdown → sticky →
> modal-backdrop → modal → toast → tooltip`) is not proposed to change in
> name or order, but non-player chrome likely needs fewer active stacking
> contexts once it is anchored rather than floating — a implementation
> simplification for `design-lead` to verify, not a new scale to design here.

## 19. Decision Log

| Decision | Choice | Why | Evidence | Trade-off |
|---|---|---|---|---|
| Whether to re-litigate the prior round's "extend, don't diverge" posture | Yes, on the structural system specifically | `PD-023` records the requester's explicit rejection of that posture and names the specific structural conventions (stage/overlay model, 8pt scale, z-index scale, component patterns) as open | `PD-023` | A longer, more speculative artifact than the prior round's — accepted because the alternative is repeating the rejected posture |
| Number and shape of alternative territories | Three, differing in layout model / spacing rhythm / component visual language, not palette | `.agents/agents/creative-director.md`'s own instruction for genuine divergence: 2–3 direction-level differences, not "dark version/light version" | `.agents/agents/creative-director.md` | More territories generated and more explicitly rejected than a typical feature needs — accepted because `PD-023` specifically asked for this rigor |
| Winning territory | Territory 2, The Console (flat, anchored-chrome system) | Lowest derivation risk (grounded in an existing, already-decided product mechanism — the two-tier chrome-visibility split); directly answers the specific structural conventions `PD-023` named; passes the AI-slop test by construction | `01c-page-strategy.md` §06 (persistent-elements), `PD-022`, `AC-2.2` | Less overtly "cinematic" in the theatrical, frame-heavy sense Territory 1 offered — accepted because Territory 1's frame motif carried a real risk of reading as literal cinema costume |
| Territory 1 (The Aperture) rejected | Not selected | Genuine structural idea, but its natural decorative extension (frame motifs, film-strip/ticket-stub adjacent detailing) sits close to `DESIGN.md`'s own named "decorative film grain" anti-pattern, and the frame concept doesn't extend cleanly to dense form UI | §03 evaluation table | A more overtly "cinematic" territory is foregone in favour of a lower-risk, more precisely-fitting one |
| Territory 3 (The Vestibule) rejected | Not selected | A fixed sitewide asymmetric column ratio conflicts with `01c-page-strategy.md` §08's own locked instruction that composition follows per-screen roles, not one fixed ratio; several routes have no natural second column | §03 evaluation table | Forgoes a distinctly editorial full-site rhythm in favour of a system that respects the already-locked page-strategy composition instruction |
| Landing hero photography direction | Carried forward from the prior round (documentary candid, motivated light) | The requester's rejection targeted the structural extend-only posture, not this specific decision; re-evaluated (not silently reused) against the new structural winner and found to reinforce it (§08) | Prior `01d-creative-direction.md` §03/§04; this document's §08 | Some readers may expect every decision to be regenerated in a revision — stated explicitly here why this one specifically was re-evaluated rather than rebuilt from scratch |
| Wordmark concept | Not reopened | `PD-021`'s own consequences preserve `PRODUCT.md`'s wordmark concept as authoritative; `PD-023` is scoped to `DESIGN.md`'s structural conventions, not `PRODUCT.md`'s brand facts | `PD-021`, `PRODUCT.md` §Brand Personality | None — this was never in scope for either revision |

## 20. Open Questions

- **NON-BLOCKING**: how many distinct surface-fill roles does a flat,
  hairline-bounded system actually need, replacing the current four-step
  elevation ladder? Left to `design-lead`/`visual-designer` (§07, §15, §18).
- **NON-BLOCKING**: does the expanded monospace state-language role read
  well across all five task screens, or only on the player/readiness
  screens where "state" is most active? Left to `design-lead`'s judgment
  (§06, §17).
- **NON-BLOCKING**: what hover/focus/pressed mechanism replaces "raise
  surface" now that the system has no elevation to lift? Left to
  `design-lead` (§11, §15).
- **NON-BLOCKING**: is real production photography feasible for the landing
  hero, or does it rely on carefully screened licensed stock? Carried
  forward unresolved from the prior round (§08) — unaffected by the
  structural change.
- **NON-BLOCKING**: the player-screen footer's specific content, carried
  forward unresolved from `01c-page-strategy.md` §22 — this document adds no
  new information toward resolving it.
- **FOR THE HUMAN CONFIRMATION GATE SPECIFICALLY**: does collapsing the
  elevation ladder and moving to anchored (non-floating) chrome on non-player
  routes read, on first built screens, as "flat and precise" or as "unfinished
  and un-designed"? This is a genuine craft-execution risk of the winning
  territory that only becomes visible once `design-lead` produces real
  screens — flagged here so it is checked deliberately at that gate rather
  than discovered after implementation.

## 21. Creative Acceptance Test

| Check | Result | Reasoning |
|---|---|---|
| Thesis | PASS | "Nothing in this product floats — chrome is built into the room, not laid over it" is one concrete, visualizable structural idea, not an adjective list. |
| Product truth | PASS | The winning territory is derived from an existing, already-decided product mechanism (the persistent-header/idle-hiding-capsule split, `PD-022`), not invented from a reference. |
| Brand fit | PASS | Expresses "Plainspoken" and "Cinematic" directly; does not touch positioning, promise, or any invariant; `INV-4` is satisfied by construction, not by an added rule. |
| Page fit | PASS | Preserves every locked element of `01c-page-strategy.md` — composition-role structure, the player's overlay anchor, the editorial/conventional per-screen split — while giving the already-locked chrome-visibility mechanism its first visual identity. |
| Distinctiveness | PASS | A flat, anchored, non-floating chrome system is a genuine departure from both this product's own prior system and the category default (floating dark-mode chrome over video). |
| Effect removal | PASS | Strip all motion and photography: hairline-bounded flat panels and anchored chrome remain a coherent, legible structural idea with zero reliance on any effect. |
| AI-slop | PASS | No gradient, no glassmorphism, no elevation-as-decoration, no card grid, no generic AI humans — the flat system is structurally incompatible with the named anti-patterns rather than merely avoiding them by rule. |
| Scalability | PASS | The flat/anchored language and the two-register type system extend to any future screen or component without redesign. |
| Craft | PASS | §05/§07/§15/§18 give `design-lead` specific, executable constraints (which components change shape, which stay locked, what the elevation collapse implies) rather than mood words. |
| Downstream | PASS | `design-lead` has a concrete structural brief with explicit MUST/MAY/MUST NOT lists and a named craft risk to watch (§20); `motion-lead` has one new mechanism-level constraint (border/opacity emphasis replaces elevation change, §16) on top of page strategy's own already-complete motion brief. |

All checks pass.

```text
Strategy Version: 2.0
Status: REVIEW
Last Updated: 2026-08-22
```
