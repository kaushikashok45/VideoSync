# 01-prd.md — App-Wide Visual Rebrand, Starting from the Landing Page

- **Slug**: app-visual-rebrand
- **Stage**: 1 (PM)
- **Active phase**: 1
- **Verdict**: ENHANCE
- **Enhances**: landing, room identity, media setup, source selection, readiness, player — presentation layer only; no capability changes
- **Approved**: yes (2026-08-22) — phased approach (Alternative B) accepted as recommended

## Readiness
- **Problem**: VALIDATED
- **Existing capability**: Landing (`LIVE`) — enhanced in place, not duplicated. Player header (`LIVE`) — a genuine near-miss (see audit). `app/common/components/Header.tsx`/`Footer.tsx` (`DEAD`) — not reusable as-is.
- **Key assumptions**: 8 (0 unresolved)
- **Contradictions**: 2 (0 unresolved)
- **Impacted areas**: 8
- **Risks**: 8
- **Alternatives considered**: 4
- **Recommended approach**: B — phase the rebrand: landing + shared header/footer first (Phase 1), extend the same visual system and chrome to the remaining in-room screens second (Phase 2).
- **Out of scope**: journey/IA restructure (step count, flow order); wiring synchronized playback or control delegation; accounts, persistence, analytics, billing (closed dimensions).
- **Success signal**: a reviewer can confirm, by inspecting the 5 live routes, that (a) the same header and footer component render on every one of them, and (b) after Phase 2, none of the in-room screens reference the old dark-cinema token values.
- **Reversibility**: MODERATE
- **Confidence**: MEDIUM
- **Open decisions**: 4
- **Status**: READY

## Problem
Visitors and returning users encounter a landing page and app chrome that a stakeholder judges as insufficiently attractive or premium, and no shared branded header/footer exists to give the rest of the product a consistent identity.

- **Evidence for**:
  - **USER-STATEMENT / MEDIUM**: requester states the landing page is not "proper" or "attractive" and wants an immersive, benefit-selling layout with hyperrealistic media and experimental typography (`00-brief.md`).
  - **PRODUCT-MODEL / HIGH**: `docs/PRODUCT-MODEL.md:293-297` — the only header/footer components in the codebase are `DEAD` (zero importers); there is no live, reusable branded chrome today.
  - **CODE / HIGH**: `app/features/entry-flow/components/landing-screen.tsx:57-126` is a single hero-plus-footer screen with no dedicated benefit or feature-selling sections.
  - **CODE / HIGH**: `app/features/entry-flow/components/entry-layout.tsx:11-30` is the closest existing header, but it wraps only entry-flow routes (landing/setup/source/pre-play) and has no footer counterpart.
- **Evidence against**: **USER-STATEMENT / MEDIUM** — this is stakeholder visual preference, not measured evidence; `PRODUCT-MODEL.md` confirms the product has no analytics of any kind, so no conversion or bounce data exists to support or refute the claim. Named here rather than omitted because the success signal below has to be a falsifiable observable, not a metric.

## Non-goals
- Restructuring the 5-step progressive-disclosure journey, step count, or navigation model (`PRODUCT.md`'s "Approved journey direction" is unchanged; confirmed in `00-brief.md` resolved assumption #6).
- Wiring synchronized playback or control delegation — both remain `CONTRACT-ONLY`/`UNWIRED` and are unrelated to a visual rebuild.
- Replacing `PRODUCT.md`'s brand-personality words or the "Sync Party" name/wordmark concept — only the concrete visual execution (`DESIGN.md`'s tokens) is open per `PD-021`.
- Loosening any accessibility commitment (AA contrast, `prefers-reduced-motion`, keyboard operability) to make room for "experimental" typography — these are non-negotiable per `PRODUCT.md` and `00-brief.md` resolved assumption #8.

## Existing-capability audit
| Existing capability | Where | Wiring status | Overlap | Why it does/doesn't cover this |
|---|---|---|---|---|
| Landing screen | `app/features/entry-flow/components/landing-screen.tsx` | `LIVE` | Total — same route | Enhanced in place; the current single-section layout (lines 57–126) has no dedicated benefit/feature-selling sections and no hyperrealistic media — this request extends it rather than duplicating a route. |
| Player header (`PlayerHeader`) | `app/widgets/player-shell/ui/player-header.tsx` | `LIVE` | Partial — near-miss | Already renders unconditionally regardless of idle state: `player-shell.tsx:171-178` shows `ControlBar` gated by `hidden={!visible}` while `PlayerHeader` (line 176) is not gated at all. So "persistent chrome during windowed playback" already exists for this one element — but it is a player-local brand mark, room code, and exit button, not the shared app-wide header/footer this feature needs, and it has no fullscreen-aware hide rule and no footer counterpart. |
| `EntryLayout` header slot | `app/features/entry-flow/components/entry-layout.tsx:11-30` | `LIVE` (entry-flow routes only) | Partial | Renders `BrandMark` plus a `headerActions` slot — the closest thing to an app-wide header today — but it wraps only landing/setup/source/pre-play, never the player, and has no footer counterpart. |
| `app/common/components/Header.tsx` / `Footer.tsx` | `app/common/components/{Header,Footer}.tsx` | `DEAD` | Same concept, zero working overlap | Zero importers; not reusable as a starting point without re-verifying against a visual system that doesn't exist yet — treated as outstanding work, not duplication. |
| `landing-footer.tsx` | `app/features/entry-flow/components/landing-footer.tsx` | `LIVE` (landing only) | Partial | Superseded by the new shared footer; currently scoped to one route. |
| Utility fullscreen control | `app/widgets/player-shell/ui/utility-controls.tsx` | `LIVE` | Enables `PD-022` | The browser Fullscreen API is already wired into the player, confirming "hidden only in true fullscreen" needs no new low-level plumbing, only a new listener consuming it. |
| Room identity / setup / source-selection / readiness screens | `app/features/entry-flow/components/{setup-screen,source-screen,host-preplay-screen,room-identity-card}.tsx` | `LIVE` | Full — reskin target | Enhanced in place in Phase 2; no change to flow, step count, or underlying state. |
| Synchronized playback / control delegation | `shared/contracts/data-channel-messages.ts`, `app/features/room-controls/model/host-tools-behaviour.ts` | `CONTRACT-ONLY` / `UNWIRED` | None | Out of scope — a presentation-only feature does not touch either. |

## Impact analysis
| Dimension | Exists here? | What changes | What could break |
|---|---|---|---|
| Rooms and membership | Yes | No logic changes; new persistent chrome adds fixed header/footer around existing room-identity UI. | Header/footer could visually crowd or duplicate the room-code display already owned by `room-identity-card.tsx`. |
| Playback | Yes | `PD-022` changes the chrome-visibility model for the header/footer specifically (always-visible-except-fullscreen), while `ControlBar` and reactions keep the existing idle auto-hide (`use-idle-visibility.ts`). | Two different visibility rules coexisting on one screen could visually conflict or compete for the same vertical space as the existing bottom-center capsule and reaction tray. |
| Control delegation | Yes (`UNWIRED`) | Nothing — this feature is presentation-only and does not touch `host-tools-behaviour.ts` or its unwired server/client layers. | N/A — no interaction with this feature. |
| Social (chat/reactions) | Yes | No logic changes; the reaction tray and chat entry points continue to render inside the player. | If the footer is used on the player screen, it risks overlapping the reaction tray's fixed bottom position (`reaction-tray.tsx`), the exact coexistence question `PD-022` already flags for `design-lead`. |
| Supporting (error surfaces, toasts, chrome auto-hide) | Yes | New chrome introduces a second visibility behavior alongside `use-idle-visibility.ts`'s existing one. | Z-index conflicts if header/footer aren't placed correctly on `DESIGN.md`'s semantic scale (`overlay(10) → … → tooltip(70)`); toasts/banners must still be reachable above or below the new persistent chrome as appropriate. |
| Navigable surface / routing | Yes | No route changes — same 5 live routes gain a shared wrapper. | A wrapper applied inconsistently could omit a route, defeating the "every screen" requirement. |
| Roles / Authorization | Yes | None — presentation only; the existing client-side-only, advisory authorization model is untouched. | N/A — no interaction with this feature. |
| Accessibility (carried in via `PRODUCT.md`) | Yes | Every screen's landmark/heading structure changes once wrapped in a shared header/main/footer. | Duplicate or missing `<h1>`s, broken skip-to-content behavior (currently `id="main-content"` in `entry-layout.tsx:26`), or a scrambled keyboard tab order across header → main → footer. |
| Billing / accounts / persistence / analytics / feature flags / localization / native mobile / admin surface / search / reporting / audit logging / email-notification / data retention-export / migration tooling / error monitoring / rate limiting outside chat | No | — | N/A — this product has no `<X>` for each, per `PRODUCT-MODEL.md`'s closed list. |
| TMDB integration (the one exception) | Yes | Unaffected — metadata lookup UI may be re-skinned visually but no integration behavior changes. | None identified. |

## Failure modes
| Scenario | Expected behaviour | Evidence class |
|---|---|---|
| Hero image/video asset fails to load or decode (partial failure) | Headline, copy, and both CTAs remain visible and operable; the page does not depend on the media element loading to be usable. | AGENT-INFERENCE |
| `prefers-reduced-motion` is set, hero/section entrance animations are in flight (abandonment of a motion sequence) | Every animation collapses to its non-motion fallback per `DESIGN.md`'s Motion section; content is present without the animation completing. | USER-STATEMENT (00-brief.md constraint) |
| Both the header's start action and the hero's start action are triggered (duplicate action) | Both route through the same existing room-creation trigger (`landing-screen.tsx:30-55`'s `startWatching`); no second, parallel room-creation path is introduced. | CODE (`app/features/entry-flow/components/landing-screen.tsx:30-55`) |
| Browser-native fullscreen is entered by a means other than the in-app toggle (e.g. a keyboard shortcut) | Header/footer still hide, because visibility is bound to the actual `fullscreenchange`/`:fullscreen` state, not the in-app toggle's local component state. | CODE (`app/widgets/player-shell/ui/utility-controls.tsx`) + AGENT-INFERENCE |
| Host disconnects; the room ends while header/footer are visible (`PD-002`) | Header/footer stop offering room-scoped actions (invite, room code) once the terminal "room ended" state is reached. | PRIOR-DECISION (`PD-002`) |
| Two members are in the same room concurrently (chrome visibility) | N/A — header/footer visibility is per-client local UI state, not shared across members; no concurrency hazard exists. | AGENT-INFERENCE |
| Page refresh mid-scroll on the redesigned landing | User reloads to the top of the page; no scroll position or section state is persisted or expected. | PRODUCT-MODEL (closed list: no persistence) |
| Socket transport unavailable when a header-level start action fires | Routes through the existing error path (`socket === null` branch, `landing-screen.tsx:33-37`) rather than failing silently. | CODE (`app/features/entry-flow/components/landing-screen.tsx:33-37`) |

## Alternatives
| # | Approach | User value | Complexity | Risk | Reversibility |
|---|---|---|---|---|---|
| A | Rebrand every screen simultaneously in one release | High — consistent from day one | High — a full-app visual swap very likely exceeds this project's PR-size limits (~300 changed lines / ~6 files, `docs/CODING_STANDARDS.md:199`) | High — one big-bang release with no intermediate validation point | MODERATE |
| B | Phase 1: new landing + shared header/footer. Phase 2: extend the same visual system and chrome to room identity/setup/source-selection/readiness/player. | High — ships the stated priority (landing) first, and the chrome built for it is reused immediately, not rebuilt | Moderate — two independently reviewable phases | Low-moderate — each phase independently verifiable; a brief window with two visual languages across the app is acceptable because no screen is left non-functional | MODERATE |
| C | Rebrand landing only; leave in-room screens on the current dark-cinema system permanently | Medium — fixes the loudest complaint but leaves the inconsistency the requester explicitly rejected | Low | Reopens a contradiction the requester already resolved (`PD-021`) without a new reason to | EASY |
| D | Token-swap behind a runtime theme toggle, rolled out screen-by-screen with an on/off flag for instant rollback | High perceived safety | High — requires building a feature-flag mechanism | Introduces a dimension `PRODUCT-MODEL.md`'s closed list records this product does not have (`feature flags`) | N/A — rejected before reversibility is relevant |

**Recommended**: B — it is the only option that ships the brief's two MUSTs (an immediately better landing, and one consistent chrome app-wide) without either exceeding this project's PR-size discipline (A), reopening an already-resolved contradiction (C), or inventing a product dimension the model explicitly says this product doesn't have (D).

## Capabilities

### CAP-1: Attractive, benefit-selling landing experience
- **Phase**: 1
- **User goal**: A first-time visitor understands what the product does and why to start or join a room, from a hero and supporting sections rather than a single screen.
- **Acceptance criteria**:
  - `AC-1.1`: Trigger: a visitor loads `/`. Observable: the page renders a hero section plus at least one benefit/feature section distinct from the hero, and at least one bundled image or video asset — replacing the current single-section layout (`landing-screen.tsx:57-126`).
  - `AC-1.2` (negative): Trigger: any hero or section imagery is reviewed before shipping. Observable: none of it depicts synchronized multi-device playback "in action," because synchronized playback is `CONTRACT-ONLY` and does not run end to end (`00-brief.md` resolved assumption #5) — imagery shows generic viewing/social scenes only.
  - `AC-1.3`: Trigger: hero media fails to load or decode. Observable: the headline, copy, and both CTAs (start / join) remain visible and clickable; neither CTA is obscured by or dependent on the failed media element.
  - `AC-1.4` (negative): Trigger: `prefers-reduced-motion` is set. Observable: no hero or section entrance animation exceeds `DESIGN.md`'s reduced-motion ceiling; all content is present without the animation completing.
- **Data requirements**:
  - Does the hero's primary CTA route through the same room-creation trigger `startWatching` already uses, with no second, parallel creation path?
  - Do any benefit/feature claims in the sold copy imply a capability the product does not have end-to-end today (e.g., synchronized playback)?
- **Non-functional constraints**: hero/section media ships as static bundle assets (no server-side media storage or CDN exists); AA contrast; `prefers-reduced-motion` fallback for every animation; keyboard-operable CTAs with visible focus.
- **Evidence**: CODE (`landing-screen.tsx`), USER-STATEMENT (`00-brief.md`), PRIOR-DECISION (`PD-021`).

### CAP-2: Persistent branded header and footer on every screen
- **Phase**: 1 (introduced on landing); extended app-wide in Phase 2 alongside CAP-3
- **User goal**: A user recognizes the same brand chrome and can reach the same navigation entry points on every screen, including the player, without it disappearing while actively watching.
- **Acceptance criteria**:
  - `AC-2.1`: Trigger: a user visits any of the 5 live routes. Observable: the same header component and the same footer component render on every one of them.
  - `AC-2.2` (negative): Trigger: the player is in windowed (non-fullscreen) mode and idle beyond the existing idle timeout. Observable: the header and footer remain visible even though the bottom-center capsule and reactions have auto-hidden per the existing `use-idle-visibility.ts` behavior — header/footer must not disappear on idle.
  - `AC-2.3`: Trigger: the player enters true browser fullscreen, by any means (in-app toggle or native shortcut). Observable: the header and footer are hidden; exiting fullscreen restores them.
  - `AC-2.4` (negative): Trigger: the room ends because the host disconnected. Observable: the header/footer stop offering room-scoped actions (invite, room code) once the terminal "room ended" state is reached.
- **Data requirements**:
  - Does the header need a per-context slot (room code, exit action) the way `EntryLayout`'s `headerActions` slot already does, or is it identical on every route?
  - How is true fullscreen state detected — bound to the `fullscreenchange` event/`:fullscreen` state, not a component's local toggle state?
  - What does the footer contain on the player screen specifically, given the existing bottom-center capsule and reaction tray already occupy that vertical zone?
- **Non-functional constraints**: touch targets ≥44×44px; keyboard-operable; visible focus; must not violate `DESIGN.md`'s semantic z-index scale.
- **Evidence**: CODE (`player-shell.tsx:171-178`, `entry-layout.tsx:11-30`), PRIOR-DECISION (`PD-022`).

### CAP-3: New visual system applied to room identity, setup, source-selection, readiness, and the player
- **Phase**: 2
- **User goal**: A user experiences one consistent visual language across the entire journey, not just the landing page.
- **Acceptance criteria**:
  - `AC-3.1`: Trigger: a user visits room identity, setup, source-selection, readiness, or player screens. Observable: none of these screens reference the superseded dark-cinema color tokens (`bg #0d1117`, `brand #d93036`, etc.) directly; all consume the replacement token set.
  - `AC-3.2` (negative): Trigger: every text/background pairing in the replacement system is measured for contrast. Observable: no pairing used for body or large text falls below the existing AA thresholds (4.5:1 body / 3:1 large) — the rebrand must not regress a contrast ratio that currently passes.
- **Data requirements**:
  - Which existing structural rules (8pt spacing grid, semantic z-index scale, reduced-motion ceiling) are brand-independent and continue unchanged, versus which are being replaced along with the color/type tokens?
  - Is every AA-contrast pairing re-verified against the new palette screen by screen before shipping?
- **Non-functional constraints**: no change to flow, step count, or underlying state of any of the five screens; all existing accessibility commitments carry over unchanged.
- **Evidence**: CODE (`entry-flow/components/*`), PRIOR-DECISION (`PD-021`).

## Delivery phases
| Phase | Capabilities | Independently shippable because | Depends on |
|---|---|---|---|
| 1 | CAP-1, CAP-2 | A visitor gets a fully redesigned, functional landing page with consistent brand chrome; no other screen is touched or left broken — old and new visual languages coexisting briefly is a normal transitional state, not a half-migrated one, since nothing stops working. | none |
| 2 | CAP-3 | Extends the chrome and visual system already built in Phase 1 onto the remaining screens; each screen keeps its existing flow and step count, so nothing is left half-built mid-journey. | Phase 1 |

## User journey
1. A visitor lands on `/` and sees the new hero and benefit sections (`CAP-1`), wrapped in the new shared header/footer (`CAP-2`).
2. They click start or join — the existing room-creation/join flow is unchanged.
3. In Phase 2, they continue into setup, source-selection, readiness, and the player, all now wrapped in the same header/footer (`CAP-2`) and re-skinned visual system (`CAP-3`).
4. On the player, the header/footer stay visible through idle periods and disappear only on entering true fullscreen (`CAP-2` `AC-2.2`/`AC-2.3`), regardless of how fullscreen was triggered.

## Success signal and instrumentation
- **Observable**: a reviewer can confirm, by inspecting the 5 live routes, that (a) the same header and footer component render on every one of them, and (b) after Phase 2, none of the in-room screens reference the old dark-cinema token values.
- **Needs instrumenting**: nothing new — this is confirmable by direct inspection of rendered output, consistent with `PRODUCT-MODEL.md` recording no analytics, telemetry, or instrumentation of any kind. No baseline or target number is stated because none exists to baseline against.

## Research
### Competitor findings
| Product | Mechanism observed | URL | Take / reject |
|---|---|---|---|
| Scener | Single-column hero: headline + one-line value prop + a blank product illustration + a fixed 4-link header (Premium/About/FAQ/Be a Host) + Log In | https://www.scener.com/ | Reject the illustration-only imagery — conflicts with the brief's MUST for hyperrealistic imagery/video. Take the fixed, minimal-link header shape as a reference point for the new shared header. |
| A24 | Homepage is a curated carousel of full-bleed, high-resolution poster/trailer imagery in both landscape and portrait crops, with type sized only to title hierarchy — no decorative chrome around the imagery | https://a24films.com/ | Take the full-bleed high-resolution imagery + restrained type-hierarchy mechanism as the hyperrealistic-imagery reference. Reject the multi-title carousel structure — this product sells one product, not a catalog, so a "gallery of many things" structure doesn't transfer. |
| Teleparty | Not evaluated — the page returned HTTP 403 to the fetch tool | https://www.teleparty.com/ | Recorded as a research gap rather than fabricated; not used as a basis for any recommendation here. |

### Design-language findings
| Reference | Mechanism | URL | Applies to |
|---|---|---|---|
| Awwwards — "Cinematic Hero with Canvas Dot Grid & Floating Testimonials" | A dark-UI-plus-gradient hero pattern, tagged by the source itself as a recurring trend | https://www.awwwards.com/inspiration/cinematic-hero-with-canvas-dot-grid-floating-testimonials-brilliant-digital-2 | Reject — `DESIGN.md`'s existing rules of thumb explicitly forbid gradient/glassmorphism decoration ("No glassmorphism, no gradient text..."); adopting this pattern would reintroduce exactly the AI-slop shape `PD-021` must not carry forward even while replacing the token values. |
| Awwwards — typography trend note | Named 2026 direction: "3D and illustrated types, cropped and manipulated fonts with animated, alive letters" | https://www.awwwards.com/typography-is-the-new-black-trends-in-web-design.html | Applies to CAP-1's experimental typography treatment — a direction for `visual-designer` to evaluate, not adopt outright, since `PRODUCT.md`'s approved Avenir-style wordmark concept stays authoritative. |

### Identity reconciliation
`PD-021` supersedes `DESIGN.md`'s concrete token *values*. It is genuinely ambiguous whether it also supersedes `DESIGN.md`'s documented anti-slop rules of thumb (no glassmorphism, no gradient text, the AI-slop checklist) — those read as taste/quality guardrails independent of the specific dark-cinema palette, not as part of "the dark-cinema token system" the decision names. Flagged below as an open question rather than resolved unilaterally, because both readings are defensible and the answer changes what `visual-designer` may propose.

## Prior decisions consulted
| PD | Relevance | Contradicts this request? |
|---|---|---|
| `PD-021` | Establishes that this feature's visual-system replacement is authorized app-wide, not landing-only. | No — this PRD is written to implement it. |
| `PD-022` | Establishes the player's chrome-visibility exception this PRD's CAP-2 implements. | No — implemented directly in `AC-2.2`/`AC-2.3`. |
| `PD-002` | Rooms end on host disconnect; bounds CAP-2's failure-mode handling for stale room-scoped chrome actions. | No — CAP-2 is written to respect it (`AC-2.4`). |
| `PD-008` | Audio capture bound to `playing`; considered and found not to interact with header/footer chrome, which carries no media-capture responsibility. | No — no interaction. |
| `PD-003` | Authorization is advisory/client-side only; considered for whether persistent chrome introduces any authority signal. | No — header/footer add no permission-bearing UI. |

## Decisions to append to docs/DECISIONS.md
None. `PD-021` and `PD-022` are already recorded in `docs/DECISIONS.md`, proposed by `00-brief.md` and confirmed prior to this stage. This PRD settles no new product decision.

## Open questions
- **NON-BLOCKING**: Does `PD-021`'s supersession of `DESIGN.md` include its anti-slop rules of thumb (no glassmorphism/gradient text/AI-slop checklist), or only the concrete token values? Changes what `visual-designer` may classify as open versus `INVARIANT`.
- **NON-BLOCKING**: What is the actual bundle-size budget for hero image/video assets, given no CDN exists? Needed before `visual-designer`/`design-lead` commit to specific asset weights.
- **NON-BLOCKING**: What footer content belongs on the player screen specifically, given the bottom-center capsule and reaction tray already occupy that vertical zone (`PD-022` already flags this for `design-lead`; carried forward here because it materially constrains CAP-2).
- **NON-BLOCKING**: Under the new, more experimental hero layout, does "Join with a room code" still read as PRODUCT.md's required quiet secondary action beneath the dominant "Start a party" CTA, or does the redesign risk demoting it below the fold? Flagged for `design-lead` to resolve within CAP-1's layout, not a scope change.
