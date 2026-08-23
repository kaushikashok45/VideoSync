# 01c-page-strategy.md — App-Wide Visual Rebrand, Starting from the Landing Page

- **Slug**: app-visual-rebrand
- **Stage**: 1c (Page Strategist)
- **Approved**: yes (2026-08-22)

## 01. Strategic Intent

This feature does not change what the product does (`01-prd.md` non-goals: no
journey/IA restructure, no new capability). It changes whether the product
*reads* as "a room of its own" — `docs/BRAND-STRATEGY.md`'s selected
positioning — rather than as an unstyled utility. Phase 1 (`CAP-1`, `CAP-2`)
gives the landing page a reason to be believed on first contact and gives every
route a shared, recognizable chrome. Phase 2 (`CAP-3`) carries that same
visual language into the room the user actually spends time in. The user goal
this strategy serves at every screen: *decide quickly whether to commit
(landing), then trust that the room is stable and consistent while doing the
actual task (everywhere else)* (PRODUCT-MODEL, `PRODUCT.md` "Approved journey
direction").

Evidence: PRODUCT-MODEL (`01-prd.md` capability table); PRIOR-DECISION
(`PD-021`, `PD-022`); PRODUCT-MODEL (`docs/BRAND-STRATEGY.md` positioning,
`INV-1`–`INV-6`).

## 02. Experience Concept

```text
Experience Mode:       hybrid — conventional for CAP-2/CAP-3 (header, footer,
                        room-identity/setup/source/readiness/player screens),
                        editorial for CAP-1 (landing only)
Experience Concept:    The landing page is a screening-room invitation, not a
                        feature brochure: it opens on the room itself (an image
                        of people watching together) before it explains
                        anything, then hands off — through the same header,
                        the same wordmark, the same red accent — into a room
                        that behaves like a room, not a marketing site wearing
                        a different skin once you're inside it.
Why This Mode:         CAP-1 is the one screen in this product whose entire job
                        is persuasion before commitment (PRODUCT.md: "A visitor
                        understands what the product does and why to start or
                        join"). Every other screen (room identity, setup,
                        source, readiness, player) is a task screen where the
                        user has already committed and needs legibility, not
                        persuasion — PRODUCT.md's "one primary user goal, one
                        dominant next action" applies unmodified. Treating all
                        six screens as one mode would either flatten the
                        landing page into task-screen plainness (losing the
                        brief's legitimate ask for a landing that sells) or
                        drag editorial/hyperrealistic treatment into screens
                        whose job is operational trust, not persuasion — the
                        exact "premium polish implying a fidelity the product
                        doesn't have" risk `BRAND-STRATEGY.md`'s Strategic Risk
                        section names.
Why A Simpler Experience Would Be Worse: A fully conventional landing (hero +
                        plain CTA, no supporting section, no imagery) is what
                        exists today (`landing-screen.tsx:57-126`) and is
                        exactly what the PRD's problem statement says reads as
                        insufficiently attractive (USER-STATEMENT,
                        `00-brief.md`). CAP-1's acceptance criteria explicitly
                        require a hero plus at least one distinct
                        benefit/feature section and bundled imagery
                        (`AC-1.1`) — a single-section conventional layout
                        cannot satisfy that criterion at all, not just
                        stylistically.
```

**Where this navigates Brand Tension #1** (premium/hyperrealistic ambition vs.
`PRODUCT.md`'s "casual, low-commitment" self-description,
`docs/BRAND-STRATEGY.md` §Brand Tensions #1 — explicitly left to this stage,
not resolved upstream): the tension resolves *per screen*, not once for the
whole feature.

- **Landing (CAP-1)** leans toward the premium/editorial end: it is a
  first-impression, zero-commitment screen where visual ambition costs
  nothing (no task is in progress to interrupt) and buys the most (it is the
  only screen a skeptical visitor sees before deciding to try the product at
  all).
- **Room identity, setup, source-selection, readiness (CAP-3)** lean toward
  "casual, low-commitment": the user has already committed to a room and now
  needs to complete a short task (confirm identity, pick a source, check
  readiness) with the same low cognitive load `PRODUCT.md`'s "smooth"
  definition requires. The same token system and wordmark apply, but nothing
  about these screens should perform ambition at the cost of speed to task
  completion.
- **Header/footer chrome (CAP-2)** stays the most restrained of all: chrome
  that shows visual ambition competes with `INV-6` ("the content being
  watched stays the visual and narrative center") on the one screen where
  that matters most, the player.
- **Player (CAP-3)** is the strictest "casual/low-commitment" end of the
  spectrum: `PRODUCT.md` Principle #1 ("the video is the stage") and `INV-6`
  are non-negotiable there regardless of how ambitious the landing gets.

## 03. Page Architecture

**Route inventory** (PRODUCT-MODEL, `docs/PRODUCT-MODEL.md:101-107`): exactly
five live routes — `/` (landing), `/:id/SetupScreen` (room identity + setup,
one screen, branching host/join copy), `/:id/file-upload` (source selection),
`/:id/HostVideoPlayerNew` (host pre-play/readiness + playback), and
`/:id/RecieverVideoPlayerNew` (viewer player). **This feature adds no sixth
route** — CAP-1/CAP-2/CAP-3 are presentation changes to these five
(`01-prd.md` non-goals). Note for `design-lead`: `PRODUCT.md`'s five-stage
"approved journey direction" (landing → room identity → media setup →
readiness → player) does **not** map one-to-one onto five routes —
`SetupScreen` already carries both "room identity" and "media setup" framing
in one screen (`setup-screen.tsx:139-237`, "Room identity first" badge next to
the host/join checklist), and `HostVideoPlayerNew` already carries both
"readiness" and "playback" in one component tree. CAP-3's reskin must respect
that existing screen-to-route mapping, not invent new screens to match
`PRODUCT.md`'s five conceptual stages literally.

**Single- vs multi-page**: no change. Each route remains its own page; no
route is split or merged by this feature. Trade-off already accepted by the
PRD (non-goal: no IA restructure) — the cost of *not* re-architecting (some
screens carry two conceptual jobs) is smaller than the cost of restructuring
navigation for a presentation-only feature.

**Navigation model**: CAP-2 introduces one shared header and one shared footer
component instance rendered by every route (`AC-2.1`), replacing today's
inconsistent chrome (`EntryLayout`'s header on entry-flow routes only,
`PlayerHeader` a different, player-local component, `landing-footer.tsx`
scoped to landing only). The header's *content* is contextual — a per-context
actions slot the way `EntryLayout`'s `headerActions` already works
(`entry-layout.tsx:15-18`) — but the header and footer *components themselves*
are the same instance everywhere. This is not new navigation, it is
consolidation of three existing partial chrome implementations into one.

**How the page ends**:
- Landing: ends at either CTA (`Start a watch party` / `Join with a room
  code`) routing into the existing room-creation/join flow — no new
  terminal state.
- Room identity/setup, source-selection: end at the existing "continue"
  action into the next route — unchanged by this feature.
- Readiness/player: **this page never ends** in the way a marketing page
  "ends." `PRODUCT.md`'s player is a persistent, continuously-live surface
  (chat, reactions, sync) with no resolution beat — the only terminal states
  are the user leaving voluntarily (`onExit`, `player-header.tsx:9`) or the
  room ending because the host disconnected (`PD-002`). CAP-2's footer on the
  player screen must not invent a footer-as-resolution ("you're done!")
  because no such state exists here.

## 04. Experience Arc

**Landing (CAP-1)** — orientation → discovery → proof-lite → action:
1. **Orientation**: the visitor understands what kind of thing this is (a
   room for watching together, not a utility) before reading any copy — the
   hero's imagery and the header's presence establish this.
2. **Discovery**: the benefit/feature section(s) required by `AC-1.1` explain
   *why* to start or join, addressing "will this actually stay in sync with
   my friends?" honestly (see §12).
3. **Action**: the dominant CTA (start) and the quieter secondary action
   (join) are both reachable without scrolling past the hero —
   `PRODUCT.md`'s "one visually dominant next action, secondary actions
   available without competing."

There is no further "resolution" arc phase on landing — the page's job ends at
the click, handing off to the existing flow.

**Room identity/setup, source-selection, readiness (CAP-3)** — single
continuous state, no scene transitions, per screen. Each of these routes
already satisfies `PRODUCT.md`'s "each screen has one primary user goal" —
this feature does not add a narrative arc to them, it re-skins them. Any
sense of "arc" across these routes is the existing journey sequence itself
(`PRODUCT.md` §Approved journey direction), not something CAP-3 needs to
invent additional choreography for.

**Player (CAP-3 + CAP-2's fullscreen behavior)** — continuous state with one
real state-dependent beat: chrome visibility. Entry: header/footer/controls
visible. Development: idle → bottom-center capsule and reaction tray
auto-hide (`use-idle-visibility.ts`, unchanged) while header/footer stay
visible (`AC-2.2`, `PD-022`). A distinct, less frequent development beat:
entering true fullscreen → header/footer also hide (`AC-2.3`). There is no
"reveal" or "proof" phase beyond this — the player's entire experience arc
*is* the playback session, which this feature does not touch.

## 05. Experience Choreography

**Landing**: single continuous scroll surface, not a multi-scene sequence.
`AC-1.1` requires "a hero section plus at least one benefit/feature section
distinct from the hero" — this is page composition (a hero followed by
supporting content in normal document flow), not scene-based choreography
with hard transitions. Do not manufacture scroll-triggered scene changes to
fill this section; nothing in the PRD or brand strategy asks for that, and
`INV-4`/`DESIGN.md`'s existing anti-slop guardrails already caution against
motion that exists to look premium rather than to communicate (`.agents`
governance: "never add motion... because it looks premium").

**All other screens (room identity/setup, source-selection, readiness,
player)**: single continuous state, no scene transitions. Each is already one
screen with one job; CAP-3 changes what these screens are built from
(tokens, imagery treatment), not how they unfold over time.

## 06. Persistent Elements

- **Header and footer, across all five routes** (`AC-2.1`) — the entire point
  of CAP-2 is that these do *not* vary in identity from screen to screen,
  even though their contextual actions slot does.
- **Room code and role**, from the moment a room exists through to the player
  — `PRODUCT.md`'s room-identity expectation ("the room code/name and current
  role are visible and confirmable before a user commits") and CAP-2's own
  data requirement about a header context slot for room code. This must
  persist through `SetupScreen` → `file-upload` → `HostVideoPlayerNew`/
  `RecieverVideoPlayerNew` without being re-explained at each step —
  `room-identity-card.tsx` and `player-header.tsx`'s existing `Room {roomId}`
  chip already establish this pattern; CAP-2 must not regress it by
  centralizing room-code display somewhere it disappears mid-journey.
- **The header/footer during player idle**, unlike the bottom-center capsule
  and reaction tray (`AC-2.2`) — this is the persistence CAP-2 explicitly adds
  that does not exist today (`use-idle-visibility.ts` currently governs
  *all* player chrome uniformly; CAP-2 splits chrome into two visibility
  tiers).
- **The primary CTA on landing** does not need to persist through scroll (no
  scroll-linked sticky CTA is specified by any acceptance criterion) — see
  §19 for why a persistent/sticky CTA is deliberately not recommended here.

## 07. Information Relationships

- **Persistent**: header identity/room code, footer presence — across every
  route (CAP-2).
- **Sequential**: the five-route journey itself (landing → room identity/
  setup → source → readiness/player) — unchanged, CAP-3 does not alter this
  relationship, only its visual expression.
- **Simultaneous**: on the player, chrome visibility state (header/footer
  visible; capsule/tray hidden) can coexist mid-idle — two different
  visibility rules active at once, which is exactly the coexistence risk
  `01-prd.md`'s impact analysis flags (playback dimension) and which
  `design-lead` must resolve spatially, not this document.
- **Contextual**: the header's per-route actions slot (invite on room-scoped
  screens, exit on the player, nothing extra on landing) — same component,
  different contents depending on where the user is.
- **Nested**: room identity is nested inside the setup screen today
  (`setup-screen.tsx`'s "Room identity" badge/section inside the larger setup
  layout) — CAP-3 re-skins this nesting, it does not flatten it into separate
  screens (see §03).
- **Comparative**: not applicable — no screen in this product asks the user
  to compare options against each other (no source-selection is presented as
  a comparison grid; it is upload vs. URL as sequential fallback,
  `PRODUCT.md` §Approved journey direction).
- **Independent**: the reaction tray and bottom-center capsule's existing
  idle behavior is independent of CAP-2's header/footer behavior — the two
  systems must coexist without one implying control over the other (§06).

## 08. Composition Direction

- **Landing**: the hero's imagery is the visual anchor; headline, CTAs, and
  supporting benefit content are structured around it rather than the
  imagery being decoration behind text — `AC-1.1`'s "bundled image or video
  asset" is content, not backdrop, consistent with `A24`'s referenced
  mechanism (full-bleed imagery, restrained type-hierarchy) rather than a
  gradient-hero pattern (rejected explicitly in `01-prd.md`'s design-language
  research).
- **Room identity/setup/source-selection/readiness**: the task/decision area
  (name entry, source picker, media preview) stays the structural anchor;
  room identity/presence information sits as stable supporting context
  beside it, never displacing it — mirrors the existing
  `setup-screen.tsx` two-column relationship (task column + identity/
  checklist column) that CAP-3 re-skins rather than restructures.
  Composition follows `DESIGN.md`'s already-stated primary-workspace/
  secondary-context/preview/action role structure (this is architectural
  role assignment, not a layout instruction — the specific grid, columns, or
  visual weighting are `design-lead`'s call).
- **Player**: the video remains the sole visual anchor at all times; header,
  footer, capsule, and reaction tray are all overlays relative to it, never
  competing regions — `INV-6`, `PRODUCT.md` Principle #1/#11, unchanged by
  this feature.

## 09. Interaction Direction

| Interaction | User goal | Why not static | What it reveals | Complexity cost | Priority |
|---|---|---|---|---|---|
| Landing primary CTA ("Start a watch party") | Begin hosting immediately | N/A — already a single click, already exists; no new interaction proposed | Routes into existing room-creation flow | None — reuses `startWatching` (`AC-1.1`'s own data requirement) | Essential |
| Landing secondary "Join with a room code" reveal | Join without cluttering the hero with a form for the ~majority who are starting, not joining | A static, always-visible join form competes with the dominant CTA for attention, contradicting `PRODUCT.md`'s "quieter secondary action" requirement | The inline room-code field, only when requested | Low — already exists (`landing-screen.tsx:107-119`); CAP-1 does not add a new interaction here, only restyles it | Essential (already-approved pattern, not new scope) |
| Header per-route actions slot | Reach the actions relevant to *this* screen (invite here, exit there) without a header that either shows everything everywhere or nothing anywhere | A single static header content set cannot serve landing (no room yet) and the player (invite + exit + room code) equally | Confirms the user is in the right context and what they can do from here | Low — reuses `EntryLayout`'s existing `headerActions` slot pattern | Essential |
| Fullscreen-triggered chrome hide (`AC-2.3`) | Get an unobstructed view when the user has explicitly asked for maximum immersion | The header/footer are otherwise always visible (`AC-2.2`) by design — fullscreen is the one explicit, high-intent signal that visually competing chrome should yield | Confirms the app respects an explicit "give me the whole screen" request from either the in-app control or the OS/browser shortcut | Low — reuses the existing Fullscreen API listener already wired for other chrome (`utility-controls.tsx`) | Essential |

This product has exactly three inputs total (name, room code, URL,
`.agents/agents/page-strategist.md`'s own framing) — no additional
interaction is proposed anywhere in this feature beyond restyling and
consolidating what already exists. Static-first was considered for every row
above; each row's "why not static" column states the specific reason static
would fail an existing acceptance criterion or product principle.

## 10. Scroll Direction

Landing scroll is ordinary document scroll — hero, then benefit/feature
section(s), then footer — carrying no meaning beyond normal page navigation.
No scroll-jacking, no scroll-linked animation controlling content reveal
beyond ordinary entrance-on-viewport treatment (which is `motion-lead`'s
"supporting," not "essential," territory — see §18). Mobile alternative: not
applicable as a special case — scroll behaves identically on every viewport;
nothing about this landing's scroll model depends on pointer/hover
interaction that doesn't exist on touch.

All other screens: `Not applicable` — none require scrolling beyond normal
content overflow, and none use scroll as a control mechanism.

## 11. Content Strategy

**Real-time content as first-class, not just error states** (per this
document's mandate — several of this product's "state changes" are caused by
someone else):

- **Host disconnect / room ending (`PD-002`)**: the moment this occurs, the
  header/footer stop offering room-scoped actions (invite, room code —
  `AC-2.4`, already specified by the PRD). This is a content requirement on
  the header/footer, not just a player-body message: the persistent chrome
  this feature adds must itself go inert for room-scoped affordances the
  instant the room is gone, or the chrome becomes a stale promise ("invite
  people to a room that no longer exists").
- **Someone else joining mid-session**: not newly introduced by this
  feature — the existing presence/member system (`room-identity-card.tsx`,
  `RoomSidebar`) already communicates this; CAP-2/CAP-3 re-skin these
  surfaces without changing what they announce or when.
- **Sync drift / "Catching up" / "Waiting for host"**: unaffected by this
  feature — these live in playback-status UI CAP-3 re-skins but does not
  rewrite the copy or logic of (`01-prd.md` non-goals: no capability
  changes). CAP-3's token/visual replacement must preserve these state
  strings' visibility and legibility exactly, not merely their presence.
- **`PD-008` (no audio while paused)**: no interaction with header/footer
  content — confirmed not applicable by the PRD's own impact analysis.

**Landing copy** must not claim more than the product delivers: no imagery
or copy depicting synchronized multi-device playback "in action" (`AC-1.2`,
`INV-3`) — generic viewing/social scenes only, consistent with
`docs/BRAND-STRATEGY.md`'s Voice & Tone "GOOD" examples ("Waiting for host to
start," not "100% perfectly synced, guaranteed").

## 12. Trust & Proof

The actual doubt at each point in the journey, and where this feature answers
it (never with a fabricated metric, testimonial, or logo — `PRODUCT-MODEL.md`
records no analytics of any kind exists to generate one):

- **Landing — "will this actually stay in sync with my friends?"**: answered
  by demonstrated *honesty*, not a claim of perfection. `AC-1.2` already
  forbids depicting sync "in action," so proof here cannot be a feature
  screenshot of flawless multi-device playback (that would be the exact
  overclaim `INV-3` forbids). The available proof is structural: the header's
  and footer's presence on every screen (visible immediately, before commit,
  via the persistent chrome itself) signals "this is one coherent, deliberate
  place," not a bolted-together tool — the "room of its own" positioning
  demonstrated by consistency rather than asserted by claim.
- **Room identity/setup — "is this the room my friend actually sent me?"**:
  answered by the existing, unchanged room-code confirmation pattern
  (`room-identity-card.tsx`, `setup-screen.tsx`'s "Room identity first"
  framing) — CAP-3 must not visually de-emphasize the room code while
  re-skinning this screen, since it is the screen's actual trust mechanism.
- **Readiness — "is everyone actually ready, or am I about to look
  foolish?"**: answered by the existing plain-language readiness/connection
  state, unchanged by this feature (`PRODUCT.md` §User expectations
  "Playback readiness").
- **Player — "did the room just end, or is this just lag?"**: this is where
  `PD-002`'s failure mode matters most, and §11 above states the specific
  content requirement (room-scoped chrome actions go inert on room end) that
  keeps the persistent header/footer from becoming a source of false
  reassurance during exactly the moment trust matters most.

## 13. Experience Rhythm

Landing: a single deliberate pace — orient, persuade, act — with no forced
delay (no gated animation sequence a user must wait through before reaching
the CTA; `PRODUCT.md`'s "fast perceived response" and "The interface must
communicate... without requiring users to infer meaning"). All other screens:
`Not applicable` — each is already a single-beat task screen; this feature
does not introduce pacing to them.

## 14. Responsive Experience

- **Landing**: the hero's imagery is the first element that must transform,
  not merely shrink — on narrow viewports, imagery and copy stack into a
  single reading column with the primary CTA reachable without excess
  scrolling (not "desktop hero centered, mobile hero centered but
  smaller"). The benefit/feature section required by `AC-1.1` must not
  disappear on mobile; it may collapse from a multi-column layout to a
  single column, but the content itself (what makes someone decide to try
  this) is essential, not optional, at every width — `PRODUCT.md` Principle
  #10, "each [viewport] must preserve task clarity... not breakpoint
  compliance."
- **Header/footer (CAP-2)**: on mobile, the header's contextual actions slot
  must not silently drop actions to save space (e.g., dropping "invite" on
  a narrow player header) — it may consolidate them behind a single
  disclosure control, but every action available on desktop must remain
  reachable on mobile, consistent with `AC-2.1`'s "same header... on every
  one of them" (same *capability set*, not literally identical pixels).
- **Room identity/setup/source-selection/readiness (CAP-3)**: the existing
  two-column relationship (task column + identity/context column,
  `setup-screen.tsx`) is a desktop-only affordance already — on mobile this
  is already a stacked single column. CAP-3 must preserve room identity as
  reachable (not pushed below a long scroll) on mobile, since `PRODUCT.md`'s
  room-identity expectation applies at every viewport, not desktop-only.
- **Player**: unaffected by this feature beyond token/imagery replacement —
  the existing idle-hide-then-reveal-on-touch model for the capsule/tray is
  untouched; CAP-2 adds the header/footer's separate, non-idle-hiding
  visibility tier on top of it, at every viewport.
- **Essential proposition does not depend on motion, hover, or a complex
  interaction**: every CTA, every state message, and every piece of trust
  content (§12) is legible and operable with entrance animations skipped
  entirely, with no hover state (touch has none), and with a single tap/click
  per action. `use-idle-visibility.ts` already auto-hides player chrome on
  idle and already respects `prefers-reduced-motion` (`use-idle-visibility.ts:10,13,23`)
  — CAP-2's added header/footer visibility tier must inherit that same
  reduced-motion respect rather than introduce a second, differently-behaved
  motion system.

## 15. Accessibility

No accessibility commitment is loosened by this feature (`01-prd.md`
non-goals states this explicitly). Specific to this feature's own
architecture:

- Wrapping every route in a shared header/main/footer (CAP-2) changes the
  landmark and heading structure on every screen at once — `design-lead`
  must verify no duplicate or missing `<h1>`, that skip-to-content
  (`id="main-content"`, `entry-layout.tsx:26`) still resolves correctly once
  the shared header/footer are introduced, and that tab order flows
  header → main → footer without a trap, exactly as `01-prd.md`'s impact
  analysis already flags as a risk.
- The fullscreen-triggered chrome hide (`AC-2.3`) must not hide focus that
  currently lives inside the header/footer — if a keyboard user is focused
  on a header control when fullscreen is entered by another means (e.g., a
  co-viewer's action cannot trigger this locally, but an OS shortcut can),
  focus must move somewhere operable, not vanish with the hidden chrome.
- AA contrast (`AC-3.2`) and touch targets ≥44×44px (`CAP-2` non-functional
  constraint) apply to every new/re-skinned chrome element exactly as they do
  today — this document does not relax either.

## 16. Performance

Landing hero/section media ships as static bundle assets — no CDN, no
server-side media storage exists (`AC-1.1`'s data requirement,
`PRODUCT-MODEL.md`'s closed list). `AC-1.3` already requires the page remain
fully usable (headline, copy, both CTAs) if hero media fails to load or
decode — this is a hard floor, not a nice-to-have: the landing page's actual
proposition (get to a room) must never depend on a media asset resolving.
Bundle-size budget itself is an open question the PRD already flags
(non-blocking) and is not resolved here — see §22.

## 17. Design Brief

**MUST establish**
- One shared header component and one shared footer component, rendered
  identically (same component, contextual slot content) across all five
  routes (`AC-2.1`).
- A landing hero where imagery is structural content, not backdrop decoration
  — the hero must fail gracefully to text-only if the image/video fails
  (`AC-1.3`).
- At least one benefit/feature section on landing, visually distinct from the
  hero, that does not depict synchronized playback "in action" (`AC-1.2`).
- A header content slot that varies by route context (room code + invite on
  room-scoped screens; exit on the player; nothing extra on landing) without
  changing the header's identity/position (§06, §09).
- Room code/identity as a visually stable, unmissable element from
  `SetupScreen` through to the player (§06, §12) — never subordinated to
  decorative treatment.

**MUST preserve**
- `PRODUCT.md` Principle #1/#11 ("the video is the stage" / "player is a
  stage, not a dashboard") — the player screen's composition anchor is the
  video, unconditionally, regardless of how ambitious the landing gets.
- The existing idle-hide behavior of the bottom-center capsule and reaction
  tray (`use-idle-visibility.ts`) exactly as it works today — CAP-2 adds a
  second, non-idle-hiding tier for header/footer; it does not change the
  first tier.
- AA contrast and the 44×44px touch-target floor on every re-skinned
  element (`AC-3.2`, CAP-2 non-functional constraints).
- `DESIGN.md`'s existing structural rules that `01-prd.md`'s own "Identity
  reconciliation" section and `01b-brand-alignment.md`'s resolution both
  confirm survive `PD-021`: the 8pt spacing rhythm, the semantic z-index
  scale, and — per `INV-4`, binding at brand level — the anti-slop rules of
  thumb (no glassmorphism, no gradient text, no generic-SaaS card grids).

**SHOULD explore**
- Hyperrealistic/experimental imagery and typography treatment for the
  landing hero specifically, per the stakeholder's original brief — bounded
  by `INV-3` (no sync-in-action depiction) and `INV-4` (no glassmorphism/
  gradient-text/AI-slop decoration to achieve the "premium" feel).
- Whether the header's per-route actions slot needs a visually distinct
  "at rest" state on landing (no room yet) versus an "in a room" state
  (room code present) — a content-slot design question, not a new
  architecture question.
- A footer treatment for the player screen specifically that coexists with
  the existing bottom-center capsule and reaction tray without duplicating
  their vertical zone — the PRD's own flagged open question (§22).

**MUST NOT become**
- A generic SaaS dashboard shell (sidebar + gray cards) — explicit anti-
  positioning (`docs/BRAND-STRATEGY.md` §Brand Anti-Positioning).
- A feature-brochure landing depicting capabilities not wired end to end,
  specifically synchronized multi-device playback shown "in action"
  (`AC-1.2`, `INV-3`).
- A header/footer that competes with the video for visual dominance on the
  player screen, or that overlaps the existing bottom-center capsule/
  reaction tray's vertical zone without a resolved coexistence plan
  (`01-prd.md`'s own flagged risk).
- A persistent/sticky landing CTA that duplicates or competes with the
  hero's dominant CTA (see §19, deliberately excluded).

## 18. Motion Brief

**Essential**
- The chrome-visibility state change on fullscreen entry/exit (`AC-2.3`) —
  the header/footer must legibly appear/disappear in response to this
  explicit user (or system) event; without any transition at all the change
  is still comprehensible (chrome present vs. absent), so motion here is a
  polish layer, not information-bearing on its own — this is *supporting*,
  not essential, when judged against "no information becomes inaccessible
  without it" (see below).
- Actually nothing on this feature is essential motion by that strict test:
  every state (chrome visible/hidden, hero loaded/failed, room-ended chrome
  gone inert) is fully comprehensible from the end-state alone, with no
  information encoded only in the transition. State this plainly to
  `motion-lead` rather than inventing an essential-motion requirement to fill
  the category.

**Supporting**
- Landing hero/section entrance-on-viewport treatment as the visitor
  scrolls — communicates arrival/discovery pacing but is not required for
  comprehension (content is present and readable immediately in a
  reduced-motion or motion-skipped state, per `AC-1.4`).
- The chrome-visibility transition itself (header/footer appearing on
  exiting fullscreen, or going inert on room end) — softens an otherwise
  abrupt DOM change but does not carry information the instant end-state
  doesn't already convey.

**Optional**
- Any micro-interaction on the landing CTA/hover states beyond what already
  exists on the current `Button` component — nice-to-have, not requested by
  any acceptance criterion.

**Motion Must Communicate**
- That the header/footer's visibility is bound to a real, stateful event
  (fullscreen, room-ended), not a decorative flourish unrelated to what's
  actually happening — motion here should reinforce *why* the chrome
  changed, if used at all.

**Motion Must Never**
- Delay or block reaching either landing CTA — `AC-1.1`'s hero must present
  the CTA immediately, not after an entrance sequence completes.
- Exceed `DESIGN.md`'s reduced-motion ceiling; every animation collapses to
  its non-motion fallback under `prefers-reduced-motion` (`AC-1.4`,
  `DESIGN.md` §Motion, already enforced for player chrome by
  `use-idle-visibility.ts:10,13,23` — CAP-2's new header/footer tier must
  match this exactly, not introduce a second standard).
- Animate the video element itself, or anything that could be mistaken for
  playback state (a moving/animated hero asset that looks like it could be
  the synced video) — this would risk implying the sync depiction `AC-1.2`/
  `INV-3` explicitly forbid.
- Compete with the reaction tray/bottom-center capsule's existing motion
  language on the player screen with an unrelated, differently-timed motion
  system for header/footer.

## 19. Deliberate Exclusions

- **Persistent/sticky landing CTA rejected**: it would compete with the
  hero's own dominant CTA for the same attention `PRODUCT.md` requires stay
  singular and undivided ("one visually dominant next action"), and no
  acceptance criterion asks for one — the hero's CTA is already reachable
  without scroll.
- **Scroll-jacking / scroll-controlled scene reveal on landing rejected**:
  nothing in `AC-1.1`–`AC-1.4` requires content to be gated behind
  scroll-position control, and this product's actual scarce resource is
  making real-time state changes legible instantly (per this document's own
  governing mandate) — scroll-jacking works against instant legibility by
  design, and would additionally violate `DESIGN.md`'s existing "no
  animate layout properties," "never delay comprehension" rules.
- **A sixth "marketing" route split out from `/` rejected**: `01-prd.md`
  explicitly scopes CAP-1 as enhancing the existing landing route in place,
  not duplicating it (`Existing-capability audit` row 1) — adding a route
  is a significant architectural act this presentation-only feature has no
  warrant to take.
- **Uniform single visual mode across all six screens rejected** (see §02):
  applying the landing's editorial ambition to task screens would violate
  `PRODUCT.md`'s "casual, low-commitment" self-description and risk the
  exact "premium polish implying fidelity we don't have" risk
  `docs/BRAND-STRATEGY.md` names as CRITICAL; applying task-screen restraint
  to the landing would fail `AC-1.1`'s own requirements outright.
- **A distinct decorative "gallery of scenes" landing hero (à la a
  multi-title carousel) rejected**: `01-prd.md`'s own competitor research
  already rejects this (A24's carousel structure) because this product
  sells one product, not a catalog — carried forward here rather than
  re-litigated.

## 20. Strategic Invariants

- The video is the sole visual anchor on the player screen at all times,
  regardless of chrome visibility state (`PRODUCT.md` Principle #1/#11,
  `INV-6`).
- Room code and role remain visible and stable from the moment a room exists
  through to the player, never subordinated to decorative chrome
  (`PRODUCT.md` §Room identity expectation).
- No imagery or copy on any screen depicts synchronized multi-device
  playback, enforced permissions, or persistence as a present, functioning
  fact (`AC-1.2`, `INV-2`, `INV-3`).
- Header/footer identity (the same component, not merely a similar style) is
  constant across all five routes; only contextual slot content varies
  (`AC-2.1`).
- Header/footer visibility answers only to true fullscreen state and
  `PD-002`'s room-ended state — never to the idle timer that governs the
  capsule/reaction tray (`AC-2.2`, `AC-2.3`, `AC-2.4`).
- Every animation collapses to a non-motion fallback under
  `prefers-reduced-motion`, with no information lost (`AC-1.4`, `DESIGN.md`
  §Motion).

## 21. Downstream Contract

**DESIGN LEAD MUST PRESERVE**
- The six-screen route/screen mapping stated in §03 (no new route; existing
  screen-to-conceptual-stage mapping).
- The persistent-elements list in §06 and the composition-anchor statements
  in §08 (video on player, task/decision area on task screens, imagery on
  landing).
- The `AC-1.2`/`INV-3` imagery constraint and the `AC-2.4`/`PD-002` chrome
  content-inertness requirement.
- `INV-4`'s brand-level anti-slop guardrails regardless of how new the token
  values under `PD-021` are.

**DESIGN LEAD MAY INTERPRET**
- Specific colour, typography, exact layout, imagery style/sourcing, and
  component visual treatment for every screen — this document names no hex
  code, font, or layout.
- How the header's contextual actions slot is visually expressed per route.
- Where and how the player-screen footer coexists with the existing
  bottom-center capsule and reaction tray (§17 SHOULD explore; §22 open
  question).

**MOTION AGENT MUST PRESERVE**
- The essential/supporting/optional distinction in §18 — nothing here is
  essential motion by the strict "information inaccessible without it" test.
- The reduced-motion floor already established by `use-idle-visibility.ts`
  and `DESIGN.md` §Motion, applied identically to CAP-2's new header/footer
  visibility tier.
- The "motion must never" list in §18, in particular: never delay reaching a
  CTA, never imply sync-in-action, never compete with existing player motion.

**MOTION AGENT MAY INTERPRET**
- Specific timing, easing, and transition mechanics for every state change
  named in §18 — this document names no duration, curve, or mechanic.

## 22. Open Decisions

- **What does the footer contain on the player screen specifically?**
  Carried forward unresolved from `01-prd.md`'s own CAP-2 data requirement —
  the existing bottom-center capsule and reaction tray already occupy that
  vertical zone. This document states the coexistence constraint (§17, §20)
  but the concrete resolution is `design-lead`'s to propose and a human's to
  confirm, since it may require a footer that is minimal or route-conditional
  on the player specifically.
- **Bundle-size budget for hero image/video assets** — carried forward
  unresolved from `01-prd.md`; needed before `visual-designer`/`design-lead`
  commit to specific asset weights (§16).
- **Does "Join with a room code" still read as the required quiet secondary
  action under a more editorial hero layout?** Carried forward from
  `01-prd.md`; this document's position (§09) is that the interaction itself
  should not change, but the specific visual demotion risk is `design-lead`'s
  to verify against the finished layout, not resolvable in the abstract here.
- **Whether the header's "at rest" (no room) vs "in a room" (room code
  present) states need a distinct visual treatment, or only distinct content**
  — flagged in §17 as SHOULD explore, not required by any acceptance
  criterion; left to `design-lead`'s judgment.

## 23. Acceptance Test

| Check | Result | Reasoning |
|---|---|---|
| Concept — one clear, product-specific, visualizable concept | PASS | "A screening-room invitation that hands off through the same chrome into a room that behaves like a room" names this product's actual object (room, not session) and its actual structural fact (five specific routes, one shared chrome) — not a generic template. |
| Narrative — intentional beginning, development, ending | PASS | §04 states orientation → discovery → action for landing; explicitly states no invented arc for task screens or the player, rather than padding with a fabricated ending where none exists (§03's "the player never really ends"). |
| Anti-generic — could another strategist reuse this concept for an unrelated product | PASS | The concept depends on this product's specific structural facts (exactly five routes, `PD-002`'s host-disconnect ending, `PD-022`'s fullscreen-only chrome hide, the existing `EntryLayout`/`PlayerHeader` near-misses) — none of which transfer to an unrelated product without rewriting. |
| Anti-generic — strip every visual effect, does the concept still make sense | PASS | Strip all motion/imagery/color and the underlying claims remain true and meaningful: one component renders everywhere, room identity persists, the video stays the anchor, chrome goes inert when the room ends. None of that requires any visual effect to be coherent. |
| Architecture — single-vs-multi-page justified, navigation has stated purpose | PASS | §03 justifies no new route (presentation-only scope, existing screen mapping) and states the specific purpose of the header/footer consolidation (replacing three inconsistent partial implementations with one). |
| Interaction — every interaction has a user purpose, static considered first | PASS | §09's table states "why not static" for every row; no interaction is invented beyond restyling four already-existing interactions. |
| Motion — essential vs optional distinguished, no information inaccessible without it | PASS | §18 explicitly tests every candidate motion against "information inaccessible without it" and concludes nothing in this feature is strictly essential — stated honestly rather than inflated to fill the category. |
| Responsive — mobile is a transformed experience, not desktop stacked | PASS | §14 states specific per-screen transformations (hero imagery restructuring, header action consolidation behind disclosure, preserved-not-dropped room identity) rather than "stacks vertically." |
| Downstream — design-lead and motion-lead each have a concrete problem, neither invents the concept | PASS | §17/§18/§21 give each discipline MUST/SHOULD/MUST NOT and Essential/Supporting/Optional lists grounded in this document's specific concept and constraints, with two named open decisions (§22) flagged rather than silently resolved. |

All checks pass. No check fails.

```text
Strategy Version: 1.0
Status: APPROVED
Last Updated: 2026-08-22
```
