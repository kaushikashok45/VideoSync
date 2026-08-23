# 01e-visual-identity.md — App-Wide Visual Rebrand, Starting from the Landing Page

- **Slug**: app-visual-rebrand
- **Stage**: 1e (Brand Visual Designer)
- **Approved**: yes (2026-08-22) — visual grammar and the DESIGN.md delta scope (§21) both confirmed

## 01. Visual Identity Thesis

**Outside the player, nothing in this product's chrome is lit from above or lifted off the room behind it — every panel, field, and popover is a flat plane of the room's own material, made legible by a hairline edge, not by a lighter fill or a cast shadow.**

This is the reproducible grammar of `01d-creative-direction.md`'s selected thesis ("nothing in this product floats," Territory 2 — The Console): a behaviour (how a boundary is drawn), not a mood word. It governs every non-player surface on every route; `PlayerShell` keeps its existing overlay/stage model unchanged, exactly as `01d`'s §05/§15/§18 require.

## 02. Visual Grammar

Rules a designer can apply to a screen this document never mentions:

- **Boundary mechanism, not elevation.** A region is set apart from its background by a **1px hairline** (`border`/`borderStrong`), never by a lighter fill step, a shadow, or a blur. If a designer reaches for `box-shadow` or a lighter background to "lift" something outside the player, the grammar has been violated. `INVARIANT`.
- **Contrast does the hierarchy work elevation used to do.** Since nothing can visually "come forward," what matters most is signalled by ink weight (`ink` vs `inkMuted` vs `inkFaint`), border weight (`border` vs `borderStrong`), and the single `brand` accent placement — never by a surface stepping toward the viewer. `INVARIANT`.
- **Density is a register, not a screen-by-screen choice.** Landing hero: expansive, generous vertical rhythm (`xl`/`xxl`/`xxxl`/`display` spacing steps dominate). Every other screen's chrome and task UI: tighter, more uniform rhythm (`xs`/`sm`/`md` dominate; large steps reserved for genuine section separation, not decoration). A screen must commit to one register or the other; it must never blend both to "feel a bit premium." `CORE`.
- **Alignment is rigid, not playful.** Hairline-bounded flat systems expose every misalignment; panels, fields, and the header/footer hairline all resolve to the 8pt grid with no optical fudging beyond the existing 4px micro-step. `INVARIANT` (inherits `PRODUCT.md` Principle #12, unchanged by this feature).
- **Edge behaviour is contained everywhere except the landing hero photograph and the video.** Every non-player panel is a closed rectangle with a visible hairline boundary; only the hero photograph (full-bleed, escaping the container edge) and the video (the stage) are permitted to run to the frame. `INVARIANT`.
- **One focal point per non-player screen.** Task screens keep exactly one primary workspace per `01c`'s role structure; the flat system must not use its lack of elevation as license to add a second competing panel of equal visual weight. `CORE`.
- **Negative space separates roles; hairlines separate regions.** Where `01c`'s role split (primary workspace / secondary context / preview / action) needs a visible seam, use a hairline; where it only needs breathing room, use spacing alone — do not add a hairline everywhere a spacing gap would do, or the system reads as a grid of boxes (the exact "generic-SaaS card grid" `INV-4` forbids). `CORE`.
- **Overlap is reserved for the player and the hero.** Only the player's overlay chrome (capsule, tray, and — on that route only — header/footer) and the landing hero's typographic block over the photograph are permitted to overlap another visual element. Every other panel occupies its own, non-overlapping region. `INVARIANT`.

## 03. Typography System

Existing `DESIGN.md` roles carry this feature entirely; **the three-role system (Avenir-style wordmark, system-sans UI, restricted monospace) is unchanged and not reopened** (`01d` §06, `PD-021`'s own consequences). What this feature adds is a **usage rule establishing the two registers `01d` specified as a relationship, not a table** — resolved here into the actual roles/values each register may reach for.

**Register A — Landing hero (editorial, expansive).**
- Uses the existing `display` role (`Avenir Next`/`Helvetica Neue`, weight 600, line-height 1.1, letter-spacing −0.04em) and no other heading role.
- **Delta**: `display.fontSize` becomes fluid — `clamp(2.5rem, 5vw + 1rem, 3.5rem)` — replacing the current fixed `3.5rem`, so the hero headline transforms with viewport width (per `01c` §14's "imagery and copy must transform, not merely shrink") rather than needing a second breakpoint-specific size. This follows the same fluid-clamp device `DESIGN.md` already uses for `brandName` (`clamp(2.5rem, 6vw, 4rem)`) — extending an existing pattern, not inventing one. **CORE** (see §21 Delta).
- Supporting line under the headline: `body` role, capped at the existing ~70ch measure — never `bodySm`, so the hero's supporting line reads as considered, not an afterthought.
- This register is used **only** on the landing hero block (headline + supporting line). It is not used for the benefit section, which is text-led per `01d`/`01c` and uses Register B.

**Register B — everywhere else (tight, uniform).**
- **Ceiling rule**: `display` and `h1` are not used outside the landing hero. Every other page-level or section heading — header/footer wordmark excepted (a fixed, separate role, unaffected) — is capped at `h2` (`1.5rem`/700/1.25/−0.01em). Most in-screen section headings should reach for `h3` (`1.125rem`/600/1.4); `h2` is reserved for a single page-level heading per screen where one exists.
- Body copy, captions, and labels use `body`/`bodySm`/`caption` exactly as committed — no value change.
- **Why this, not a new size table**: the "tighter, more uniform" register `01d` asked for is achieved by **restricting which rungs of the existing ladder a screen may use**, not by adding new numbers next to the existing ones. A tighter register built from a *narrower slice* of an already-committed scale is more consistent than a parallel scale would be, and needs no new governance surface.

**Expanded monospace role — scope resolved.** `01d` §06/§17/§20 left open whether the monospace role's extension into short state labels (readiness, connection, sync) reaches all five task screens or stays scoped to player/readiness. **Resolved: scoped to the player and readiness screens (`HostVideoPlayerNew`/`RecieverVideoPlayerNew`) only.** Reasoning: those are the only two contexts where state is dense and technical enough (drift, connection quality, start authority) to benefit from monospace's alignment property; `SetupScreen` and source-selection's states (upload progress, URL validation) are explanatory prose, not short technical values, and forcing them into monospace would violate `DESIGN.md`'s own existing rule that mono "must not become a decorative substitute for the system sans on running text" (`01d` §06). Room codes and technical metadata keep using monospace everywhere they already do, unaffected by this scoping. `CORE`.

## 04. Colour System

No new hue is proposed. `brand`/`brandHover`/`brandText`/`brandMuted`/`brandSoft` remain the single saturated accent (`INV-4`, `DESIGN.md` Rules of thumb — untouched by the structural change, per `01d` §07). `ink`/`inkMuted`/`inkFaint` keep their existing roles and values, working harder than before (§08 below) since no lighter "raised" fill exists to imply foreground status.

**Resolved: the elevation ladder collapses to two fill roles for non-player chrome** (`01d`'s open question, §07/§15/§18/§20):

| Role | Existing token reused | Used for |
|---|---|---|
| **room** | `bg` (`#0d1117`) | The page background on every non-player route; the space chrome is built into. |
| **panel** | `surface` (`#161b22`) | Every bounded flat plane — `Card`, `TextField`, `Popover` — on every non-player route. Distinguished from `room` by a hairline (`border`/`borderStrong`), not by being visually "lighter" in a way that reads as lifted. |

`surfaceRaised` and `surfaceSunken` are **retired for non-player chrome** and remain defined **only** for `PlayerShell`'s existing stage model (video well, capsule, popovers over the video), which this feature does not touch. This is a genuine structural implication of the flat system, not a cosmetic change: a `TextField` no longer has a distinct "sunken" well to sit in outside the player — its fill is `panel`, and its editability is signalled by border weight and focus state (§08), not by depth. `INVARIANT` for non-player chrome; `surfaceRaised`/`surfaceSunken` stay `CORE` for the player, unchanged.

## 05. Composition System

Existing `01c-page-strategy.md` composition roles (primary workspace / secondary context / preview / action) are **not redefined here** — this document specifies only how those roles are visually bounded, not how they're assigned or proportioned (`design-lead`'s call, per `01d` §15's "changes the panels' visual treatment, not their role assignment").

- **Landing**: hero photograph is full-bleed, structural content (not backdrop); the typographic block (Register A headline + supporting line + both CTAs) sits directly against the image with no card, no shadow, no panel behind it (`01d` §05/§08). The benefit section beneath it is text-led, Register B, and if any bounded block appears there at all, it is a `panel`-fill, hairline-edged block — never a shadowed card, never an icon-card grid (`INV-4`).
- **Header/footer, non-player routes**: anchored — part of the page's own document flow, separated from the body by a single hairline (`border`), not a floating bar with its own shadow or elevated fill. Same `panel`/`room` relationship as any other chrome: the header/footer read as `room`-fill with a hairline seam at the body boundary, not as a `panel` "floating" above content.
- **Header/footer, player route**: unchanged behaviourally (overlay, appears/recedes per `PD-022`) but rendered in the same flat, hairline visual language — no shadow, no elevation — so the component reads as the same object across routes even though its layering role differs (`01d` §05).
- **Room identity/setup/source-selection/readiness**: the existing primary-workspace/secondary-context two-column relationship is preserved; both the task column and the identity/context column are `panel`-fill, hairline-bounded — no visual weighting comes from one having a "raised" fill and the other not.
- **Player**: video remains the sole anchor; capsule, tray, and (on this route) header/footer are overlays per `INV-6`/`PRODUCT.md` Principle #1/#11 — entirely unchanged by this document.

## 06. Image System

**Carried forward from `01d` §08, unchanged, and given one structural consequence.**

- **Subject**: a person, or small group, watching something together.
- **Camera**: never posed toward camera; candid, observational framing.
- **Lighting**: motivated only — the glow of their own screen or a lamp; no added studio light.
- **Reality standard**: hyperreal-but-plausible documentary photography, never a graded "film still," never AI-generated human subjects, never any visible screen content or multi-device sync depicted (`AC-1.2`, `INV-3`).
- **Structural consequence of the flat system** (new to this stage): the photograph sits with **no frame device at all** — no card, no shadow, no border, no vignette. It is full-bleed content, the one region on this route that is explicitly *not* hairline-bounded, because it is not chrome; it is the thing chrome is built around. This is a rule, not an exception nobody can name: **only the hero photograph and the video may be edge-to-edge and unbounded.**

## 07. 3D / CGI System

Not applicable. Nothing in `01c-page-strategy.md`'s experience mode calls for spatial or three-dimensional treatment on any of the five routes, and Territory 2's "flat" claim is a 2D structural idea (no elevation, no depth simulation) — it is not an invitation to add dimensionality anywhere it doesn't already exist. (`01d` §09, unchanged.)

## 08. Shape, Surface & Depth Language

- **Corners**: unchanged — the existing `rounded` scale (`xs`–`full`) continues to apply to buttons, panels, and inputs at its current values. A flat system is about the *fill/boundary* language, not corner geometry; do not default to sharper corners as a proxy for "flat," and do not round further either. `CORE`.
- **Surface**: two fill roles for non-player chrome (`room`, `panel`, §04). No third role, no gradient fill, no textured or noise fill. `INVARIANT`.
- **Boundary**: the hairline (`border` at rest, `borderStrong` on hover/focus emphasis) is the *only* device that separates one flat plane from another outside the player. No shadow (`box-shadow`) may be used on any non-player panel, field, or popover. `INVARIANT`.
- **Depth**: none, outside the player. `PlayerShell`'s existing scrim/overlay depth model (gradient scrim fading controls in/out over the video) is unchanged and exempt — it is depth relative to the *video*, not a chrome-elevation system, and was never part of the ladder this document collapses. `INVARIANT` (non-player); `CORE`, unchanged (player).
- **Editable-vs-static distinction without a fill step**: since `TextField` no longer sits in a `surfaceSunken` well, editability is signalled by (a) a visible `border` at rest, (b) `borderStrong` + the existing `focusRing` on focus — no fill change on focus — and (c) a text cursor / placeholder convention identical to today's. This directly answers `01d`'s "how does a flat system show `TextField` is different from `Card`" concern implicitly raised by collapsing the ladder. `INVARIANT`.

## 09. Iconography & Graphic Devices

Not a new system — this feature does not introduce an icon family, a new pictogram language, or a new decorative device. Existing icons (stroke-based, currently used for exit/menu/utility controls) continue to consume `ink`/`inkMuted` for fill/stroke and never sit inside a filled colored badge or "achievement" chip — that visual pattern reads as the gamer/badge aesthetic `PRODUCT.md`'s anti-references and `docs/BRAND-STRATEGY.md`'s anti-positioning both reject. `PROHIBITED`: icon badges, filled circular icon backgrounds used decoratively, any icon-card grid for the landing benefit section (`01d` §05, carried forward).

## 10. UI Expression

**Brand-consistent (must not vary by screen or be silently redefined by `design-lead`)**:
- Typography's role assignment (§03): which role/register a heading, body copy, or state label uses.
- Colour roles: `room`/`panel` fill logic, `ink` hierarchy, single `brand` accent (§04).
- The hairline-boundary mechanism as the *only* way a region is set apart outside the player (§02, §08).
- The wordmark treatment, unaffected by any of this (not open to this stage).

**Product-specific (design-lead's to set, this document does not prescribe it)**:
- Information hierarchy and control layout within a panel — which field comes first, how the readiness checklist is ordered.
- Exact grid/column proportions for the primary-workspace/secondary-context split per screen (`01c` §08, unchanged here).
- The header's per-route contextual actions slot content (invite vs. exit vs. nothing).

**Usability outranks this system where they conflict**: if a genuinely necessary state (e.g. "this field has an error," "this action is disabled") cannot be communicated clearly through border/ink/text alone within this flat grammar, `design-lead` may use a semantic colour (`success`/`warning`/`danger`) exactly as already committed — the brand system supports the task, it does not override `PRODUCT.md`'s "one glance, zero confusion" principle for a functional screen.

## 11. Visual Hierarchy

With elevation removed as a hierarchy signal outside the player, hierarchy is carried by, in order of strength: (1) the single `brand` accent, reserved for the one dominant action per screen; (2) ink-tier contrast (`ink` > `inkMuted` > `inkFaint`); (3) type-role/register selection (§03); (4) border weight (`borderStrong` marks an active/focused/emphasized region, `border` marks a resting one); (5) spacing (a larger gap signals a role boundary, not a lift). No panel may signal "more important" by being a lighter fill than another panel of the same role — if two `panel`-fill regions need different weight, the difference must come from (1)–(4), not from inventing a third fill. `INVARIANT`.

## 12. Motion-Related Visual Conditions

(Conditions only — no easing, duration, or choreography; that is `motion-lead`'s territory, per `01d` §11/§16 and `01c` §18.)

- **The hairline, not a surface, is what moves under interaction.** Hover/focus/pressed feedback must express through **border emphasis (`border` → `borderStrong`) and small opacity or position shifts**, never through a fill lightening that would read as "raising" the surface — because outside the player there is no elevation left to lift (`01d` §11, resolved here as the actual mechanism, not merely "a mechanism `design-lead` judges best"). **Resolved mechanism**: default → hover = border weight increases one step (`border` → `borderStrong`); pressed = a brief, small opacity reduction on the element itself (no fill or border change beyond hover's); focus = the existing `focusRing` treatment, unchanged. `INVARIANT`.
- Any motion applied to a flat panel must preserve the hairline's role as the region's boundary mid-transition — a panel must not appear to detach from its hairline (e.g. scaling the fill without the border, or vice versa).
- The hero photograph must never be animated in a way that could read as moving/live footage (carried forward, `01d` §11/§16).
- State-change motion on the player/readiness monospace state labels (§03) must not imply more certainty than the state itself carries — a label reading "Catching up" must not animate in a way that reads as resolved before the state actually changes.

## 13. Responsive Visual System

- The `room`/`panel` fill roles and the hairline-boundary mechanism do not change by breakpoint — a flat system has nothing to "un-flatten" at smaller sizes.
- Register A (hero) is fluid by construction (`clamp`, §03) and requires no separate mobile value; Register B's ceiling rule (`h2` outside the hero) applies at every width, so mobile headings never reach for `display`/`h1` as a way to compensate for a smaller layout.
- The anchored header/footer's hairline separation from body content persists at every width; on narrow viewports the header's contextual-actions slot may consolidate behind a disclosure control (`01c` §14) but the hairline-seam visual treatment itself does not change.
- The player's overlay chrome is unaffected by this feature at any width beyond the token/fill replacement already specified (§04).

## 14. Accessibility

- **Contrast**: `room`↔`panel` (both drawn from already-verified `bg`/`surface` values) and every `ink`-tier-on-fill pairing are unchanged numerically from `DESIGN.md`'s committed contrast table — collapsing the elevation ladder does not touch any contrast ratio, since `panel` reuses `surface`'s already-AA-passing value against `ink`/`inkMuted`. `AC-3.2` is satisfied by construction, not by re-verification of new colours.
- **Focus visibility**: unaffected — the existing `focusRing` (`brand`, 2px + 2px gap) remains the sole focus indicator; removing the "focus lifts the fill" behaviour (§08) does not remove focus visibility, since the ring was never the *only* focus signal that depended on a fill change.
- **Non-colour state signals**: the hairline-emphasis mechanism (§12) is a border-weight and opacity change, not a colour-only signal — it satisfies the "do not rely on colour alone" requirement independent of any semantic colour also present.
- **Reduced motion**: the border/opacity hover-focus-press mechanism (§12) is inherently smaller-amplitude than a surface-elevation change was; it collapses cleanly to `DESIGN.md`'s existing ≤120ms crossfade/instant-state reduced-motion floor with no new fallback needed.

## 15. Design Tokens

**Existing tokens referenced, unchanged in value**: `bg`, `surface`, `ink`, `inkMuted`, `inkFaint`, `brand`, `brandHover`, `brandText`, `brandMuted`, `brandSoft`, `success`, `warning`, `danger`, `focusRing`, `border`, `borderStrong`, `onBrand`, the full `rounded` scale, the full `spacing` scale, `h2`, `h3`, `body`, `bodySm`, `caption`, `mono`, `brandName`.

**Existing tokens re-scoped in usage (no value change, semantic-role narrowing)**: `surfaceRaised`, `surfaceSunken` — retained as tokens, scoped exclusively to `PlayerShell`; no longer consumed by non-player `Card`/`TextField`/`Popover`.

**Existing token with a proposed value change**: `display.fontSize` — see §21 Delta.

**New semantic roles proposed (no new colour values — reuse of existing hex under new names)**: `room` (= `bg`), `panel` (= `surface`) — see §04, §21.

Governance tiers for each: see §17.

## 16. Visual Signature

Two things distinctive to this feature (everything else — the single accent, the wordmark, the video-as-stage principle — is the product's existing, inherited signature, per `01d` §12):

1. **The hairline as the only boundary device.** Every non-player region is legible entirely through a 1px border and never through a lighter fill, a shadow, or a blur — a genuinely uncommon discipline relative to both this product's own prior system and the flat-but-shadowed "card" convention most dark-mode products default to.
2. **Two committed typographic registers, not a blended compromise** — an expansive editorial hero and a deliberately narrow-banded, ceiling-capped scale everywhere else, made visible by a stated rule (never `display`/`h1` outside the hero) rather than left to per-screen taste.

## 17. Visual Governance

| Rule | Tier |
|---|---|
| Boundary mechanism is the hairline, never a fill step, shadow, or blur (§02, §08) | INVARIANT |
| Contrast/weight, not elevation, carries hierarchy outside the player (§02, §11) | INVARIANT |
| Alignment resolves to the 8pt grid + 4px micro-step (§02) | INVARIANT |
| Only the hero photograph and the video may be full-bleed/unbounded (§02, §06) | INVARIANT |
| Overlap reserved for the player's overlay chrome and the hero's typographic block (§02) | INVARIANT |
| Density register: expansive on landing hero, tight/uniform everywhere else, never blended (§02) | CORE |
| One primary focal point per non-player screen (§02) | CORE |
| Hairline used for role *separation*, not for every spacing gap (§02) | CORE |
| Register A = `display` role only, hero-scoped, fluid clamp (§03) | CORE |
| Register B ceiling = `h2`; `display`/`h1` not used outside hero (§03) | INVARIANT |
| Expanded monospace scoped to player + readiness only (§03) | CORE |
| Monospace never substitutes for system sans on running text (§03, inherited) | INVARIANT |
| Single `brand` saturated accent (§04, inherited) | INVARIANT |
| Two non-player fill roles only: `room`, `panel` (§04) | INVARIANT |
| `surfaceRaised`/`surfaceSunken` exclusive to `PlayerShell` (§04) | INVARIANT |
| No `box-shadow` on any non-player panel/field/popover (§08) | INVARIANT |
| No third fill role invented to express relative importance (§11) | INVARIANT |
| Hover/focus/pressed via border-weight + opacity, never fill-lightening (§12) | INVARIANT |
| No icon badges / filled icon backgrounds / icon-card grids (§09) | PROHIBITED |
| Glassmorphism, gradient text, side-stripe borders, uppercase-tracked eyebrows (`INV-4`, inherited) | PROHIBITED |
| Literal skeuomorphic console (knobs, meters, faders) (`01d` §14, inherited) | PROHIBITED |
| Staged/studio-lit "film still" hero; AI-generated or stock "diverse people" imagery (`01d` §13, inherited) | PROHIBITED |
| Corner radius scale unchanged; not a "flat = sharp corners" default (§08) | CORE |

## 18. Designer Freedom

**MUST PRESERVE**
- Every `INVARIANT` in §17.
- `01c`'s composition-role structure (primary workspace/secondary context/preview/action) and composition anchors (video on player, hero photograph on landing).
- `INV-4`'s brand-level anti-slop guardrails, regardless of how new this structural system is.
- The wordmark concept and existing contrast/accessibility commitments.

**MAY INTERPRET**
- Exact grid, column count, and per-screen visual weighting within `01c`'s role structure.
- Where a hairline vs. spacing-only separation reads best on a given screen (§02's rule states the principle, not every application).
- Header contextual-actions slot visual expression per route.
- Whether `panel`'s exact hex needs a human-perceptible micro-adjustment from `surface`'s current value once built screens are reviewed against real hairline contrast (see §23).

**MAY EXPERIMENT WITH**
- The specific small opacity/position value used for the "pressed" state (§12) — this document states the mechanism, not the exact amount; `motion-lead` and `design-lead` may explore within the reduced-motion ceiling.
- Whether a third, very narrow "field-active" border-weight step (beyond `border`/`borderStrong`) is worth a future proposal if `border`/`borderStrong` alone prove insufficient for editable-field affordance in built screens — flagged, not authorized, here (see §23).

**MUST NOT CHANGE**
- The number of non-player fill roles (two).
- The hairline-only boundary mechanism.
- The two-register typographic scoping rule.
- Any brand-strategy invariant (`INV-1`–`INV-6`) or the wordmark concept.

## 19. Deliberate Exclusions

- **A third or fourth non-player fill role** — considered and rejected; `01d`'s own text already leans toward two roles ("the room, and a bounded panel"), and a flat system that still needs three fills to feel legible has not actually flattened.
- **A lighter-fill "hover surface"** — rejected in favour of border-weight emphasis (§12); reintroducing a lighter fill on hover would quietly resurrect the elevation cue this whole territory removes.
- **A parallel, hero-specific colour or type-face system** — rejected; the hero's distinctiveness comes entirely from the photograph and the fluid `display` register, not from a second brand voice.
- **Extending the monospace state-language role to setup/source-selection** — rejected (§03); those screens' states are explanatory prose, not short technical values.
- **A drop-shadow "compromise" on `Popover` for legibility over the photograph on landing** — rejected; `Popover` does not appear over the hero photograph in this feature's scope, and if a future feature needed one, `borderStrong` + sufficient `ink`-tier contrast is the answer, not a shadow exception.
- **Rounding corners more aggressively as a visual shorthand for "flat"** — rejected (§08); corner radius is an unrelated axis and changing it would imply a design decision this document does not make.
- Everything `01d` §13/§14 already excludes at the territory level (Aperture's frame motif, Vestibule's fixed column ratio, a literal mixing-console aesthetic) is inherited unchanged and not re-litigated here.

## 20. Reference System

- **A24 homepage** — mechanism: full-bleed, high-resolution imagery with type sized only to hierarchy, no decorative chrome around the image. Principle applied: the landing hero photograph carries no frame device (§06) and the typographic block is positioned against it, not inside a container competing with it. Difference: A24 is a rotating multi-title carousel; this product has one hero image and no gallery structure (`01-prd.md`'s own research explicitly rejects the carousel structure) — the reference is used for its *imagery-as-content, chrome-recedes* mechanism only, not its navigation pattern.

## 21. DESIGN.md Delta

Proposed for the human confirmation gate (pipeline stage 14). Nothing below is final; `visual-designer` does not edit `DESIGN.md`.

> **Colour — non-player surface roles**: introduce two semantic roles for chrome outside `PlayerShell` — `room` (reuses the existing `bg` value, `#0d1117`, unchanged) and `panel` (reuses the existing `surface` value, `#161b22`, unchanged). `surfaceRaised` and `surfaceSunken` remain defined but scoped exclusively to `PlayerShell`'s existing stage model. No new hex values are introduced; this is a semantic re-labelling of existing values plus a scoping restriction, not a palette change.
>
> **Typography — `display` token value**: `display.fontSize` changes from a fixed `3.5rem` to a fluid `clamp(2.5rem, 5vw + 1rem, 3.5rem)`, matching the fluid-clamp device already used for `brandName`. `display`'s other properties (weight 600, line-height 1.1, letter-spacing −0.04em) are unchanged. Usage note added: `display` and `h1` are reserved for the landing hero; every other heading ceilings at `h2`.
>
> **Typography — monospace scope**: the restricted monospace role's documented usage note gains "and short state labels (readiness, connection, sync status) on the player and readiness screens specifically" — scoped narrower than `01d`'s open-ended proposal, per §03's reasoning above.
>
> **Components — `Card`/`TextField`/`Popover`**: background changes from `surface`/`surfaceRaised` fill-plus-shadow to `panel` fill plus a `border` (resting) / `borderStrong` (hover/focus/active) hairline, with `overlay` shadow removed from `Popover`'s definition for non-player usage. `TextField` no longer lifts its fill on focus; focus is `borderStrong` + the existing `focusRing`, fill unchanged.
>
> **Components — `Button` secondary form**: changes from `surface` fill + `borderStrong` stroke to no fill (`room`-transparent) + `border` stroke at rest, `borderStrong` on hover/focus/pressed — a plainer outlined form, per `01d` §05/§15/§18.
>
> **Components — `PlayerShell`**: unchanged, per `01d`'s explicit exemption.
>
> **Interaction — hover/focus/pressed mechanism**: the existing line "Hover on dark surfaces: raise surface +0.04 L or show a 1px `borderStrong`" is replaced, for non-player chrome, with: "Hover: `border` → `borderStrong`. Pressed: brief small opacity reduction on the element. Focus: existing `focusRing`, unchanged. No fill change on any of the three states." The player's existing hover/interaction language is unaffected.
>
> **Layout — chrome anchoring**: header/footer on every route except the player are part of the page's own document flow, separated from body content by a single hairline — not `position: fixed`/floating with their own elevation. On the player, header/footer remain overlays per the existing `PD-022` amendment.
>
> **Layout — z-index usage note**: the semantic scale (`overlay(10) → dropdown(20) → sticky(30) → modal-backdrop(40) → modal(50) → toast(60) → tooltip(70)`) is unchanged in name and order. Usage note added: anchored, non-player header/footer participate in normal document flow and do not require a z-index assignment; the scale's `overlay` tier is consumed only by the player's overlay chrome and by genuine dropdown/modal/toast/tooltip layers on any route.
>
> **Photography** (new section, carried forward from `01d` §18 verbatim): when this product uses real photographic imagery, it depicts a subject lit only by the motivated glow of a screen or lamp — no added studio light, no colour-graded gradient overlay, no visible screen content, no AI-generated human subjects. Reality level: hyperreal-but-plausible, never a produced "film still."

## 22. Decision Log

| Decision | Choice | Why | Evidence | Trade-off |
|---|---|---|---|---|
| Number of non-player surface-fill roles | Two: `room` (=`bg`) and `panel` (=`surface`); retire `surfaceRaised`/`surfaceSunken` outside the player | `01d` §07 already leans toward two roles ("the room, and a bounded panel"); a flat system needing three fills to read has not actually flattened; reusing existing hex values under new semantic names avoids inventing colour | `01d-creative-direction.md` §07/§15/§18/§20 | Editable fields lose their distinct "sunken" affordance and must signal editability through border/focus alone (§08) — accepted because it is the honest consequence of removing elevation, not a workaround |
| Editable-field affordance without a fill step | Border weight (`border`→`borderStrong`) + existing `focusRing`; no fill change | Directly answers the "how does `TextField` read as different from `Card`" question a two-role system raises | This document's §08 reasoning | A field may read subtly less "inviting to type into" at first glance than a sunken well did; flagged for the human gate's craft-risk check (§23) |
| Two-register typography values | Register A = existing `display` role, fluid-clamped; Register B ceiling = existing `h2`, no new sizes | `01d` §06 specified a relationship, not numbers; extending existing tokens (fluid clamp already used for `brandName`) satisfies "extend before inventing" more directly than a parallel scale | `01d-creative-direction.md` §06; `DESIGN.md`'s existing `brandName` clamp | A designer wanting a size between `h2` and `display` for a genuinely distinct in-between screen has no rung to reach for — accepted because no screen in this feature's scope needs one |
| Expanded monospace scope | Player + readiness only, not all five task screens | Those are the only contexts with dense, short technical state values; setup/source-selection states are explanatory prose, and mono there would violate `DESIGN.md`'s own "not a decorative substitute for system sans" rule | `01d-creative-direction.md` §06/§17/§20 | Less uniform "precision" texture across the whole journey than the maximal reading of `01d`'s open question — accepted because over-applying mono to prose is a named anti-pattern, not a stylistic preference |
| Hover/focus/pressed mechanism | Border-weight emphasis + small opacity dip on press; focus ring unchanged | `01d` §11/§16 named border/opacity as the *suggested*, not mandated, mechanism; resolving it concretely gives `design-lead`/`motion-lead` an actual rule instead of an open menu | `01d-creative-direction.md` §11/§15/§16 | Forecloses other mechanisms (underline, icon shift) `design-lead` might have preferred — accepted because an unresolved "designer picks" mechanism at this layer would fragment across five screens built independently |
| Z-index active-context simplification | Non-player anchored header/footer need no z-index assignment; scale itself unchanged | `01d` §18/§20 flagged this as a likely implementation simplification once chrome is anchored rather than floating; confirming it here gives `design-lead` a concrete implementation fact rather than a "verify this" placeholder | `01d-creative-direction.md` §18/§20 | None identified — this is a direct, low-risk consequence of the anchoring decision already made | 

## 23. Open Decisions

- **NON-BLOCKING**: whether `panel`'s exact hex (currently `surface`'s existing `#161b22`, reused unchanged) needs a small, human-perceptible adjustment once real screens are built and reviewed against a purely hairline-driven boundary — this document reuses the existing value on the theory that it already tests well against `ink`/`inkMuted`, but the craft risk `01d` §20 names ("does flat read as precise or unfinished") is exactly the kind of thing only visible on a built screen. Left to `design-lead`/the human confirmation gate.
- **NON-BLOCKING**: whether `border`/`borderStrong` alone give `TextField` enough "this is editable, type here" affordance once built, or whether a future proposal for a narrow third border-weight step ("field-active") is warranted — flagged in §18 as MAY EXPERIMENT WITH, not authorized as a token today.
- **NON-BLOCKING**: the player-screen footer's specific content, carried forward unresolved from `01c-page-strategy.md` §22 and `01d-creative-direction.md` §20 — this document's fill/border rules apply to whatever `design-lead` proposes, but the coexistence question itself is not this stage's to resolve.
- **NON-BLOCKING**: bundle-size budget for the hero photograph asset, carried forward unresolved from `01-prd.md`/`01c-page-strategy.md` §16/§22 — unaffected by anything in this document.
- **FOR THE HUMAN CONFIRMATION GATE (carried forward from `01d` §20)**: does the collapsed elevation model, once built, read as "flat and precise" or "unfinished and un-designed"? This document's hairline-only boundary rule (§02/§08) and the editable-field resolution (§08, Decision Log) are this stage's answer to that risk, but it remains a genuine craft-execution question only a built screen can settle.

## 24. Acceptance Test

| Check | Result | Reasoning |
|---|---|---|
| Recognition | PASS | The hairline-only boundary mechanism, the single accent, and the two-register type scoping are distinctive enough that a screen stripped of logo/wordmark still reads as this system, not a generic flat UI kit. |
| System | PASS | §02–§15 give rules (boundary mechanism, fill-role count, register scoping, hover mechanism) with no reference to a specific screen — a screen this document never names (e.g. an error dialog) can be built correctly from §02/§04/§08/§11/§12 alone. |
| Distinctiveness | PASS | Hairline-only boundaries with zero shadow anywhere outside the player is a genuine departure from both this product's prior system and the category default (floating, shadowed dark-mode chrome). |
| Creative alignment | PASS | Every rule traces directly to a specific `01d` section (§02→§05/§07, §03→§06, §04→§07, §08→§07/§15/§18, §12→§11/§16) — this document translates the thesis, it does not add a new one. |
| Product fit | PASS | §10 explicitly subordinates the system to `PRODUCT.md`'s usability principles for functional screens, and §14 confirms no accessibility commitment is loosened; the system does not ask a real-time, low-input product to perform ambition at the cost of task clarity outside the landing hero. |
| Consistency | PASS | Typography (two registers), colour (two fill roles + one accent), composition (hairline-bounded, non-overlapping panels), and imagery (unframed, full-bleed hero) all express the same "built into the room, not floating over it" idea from different angles. |
| Governance | PASS | Every rule in §02–§14 is tagged in §17; §18 states MUST PRESERVE/MAY INTERPRET/MAY EXPERIMENT WITH/MUST NOT CHANGE explicitly. |
| Accessibility | PASS | §14 confirms contrast is unchanged by construction (reused hex values), focus visibility is unaffected, non-colour state signals hold (border-weight, not colour-only), and reduced-motion compatibility is inherited without a new fallback needed. |
| Effect removal | PASS | Strip all motion, photography, and colour: a hairline-bounded, two-fill-role, two-register flat system remains a coherent, distinctive structural idea — none of it depends on a decorative effect to make sense. |
| Genericity | FAIL (bounded) | A hairline-bounded flat panel system, in isolation, is not itself unclonable by an unrelated premium product — "flat UI with borders instead of shadows" is a widely available pattern. What resists the substitution test is the *combination* with the single saturated accent, the Avenir wordmark, the motivated-light photograph, and the anchored-vs-overlay chrome split derived from this product's own already-decided mechanism (`01d` §04) — none of which transfer without rewriting. Flagged honestly rather than claimed as a clean PASS: the boundary mechanism alone is a craft discipline, not a defensible moat: full distinctiveness depends on this document being read and applied alongside `01d`'s photography/accent/wordmark decisions, not in isolation. |

Because one check (Genericity) is a bounded PASS rather than a clean one, this document is marked `REVIEW`, not `APPROVED`, pending the human confirmation gate's judgment on whether the combination-dependent distinctiveness argument above is sufficient or whether a further-differentiating rule is needed.

```text
Visual Identity Version: 1.0
Status: REVIEW
Last Updated: 2026-08-22
```
