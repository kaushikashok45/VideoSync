# 02a-design.md — App-Wide Visual Rebrand, Starting from the Landing Page

- **Slug**: app-visual-rebrand
- **Stage**: 2a (Design Lead)
- **Approved**: pending
- **Artifact form**: static HTML/CSS mockups (`docs/features/app-visual-rebrand/mockups/*.html`), per `AD-024` — **not** a Figma file. Figma MCP is unauthorized in this environment and its OAuth flow requires an interactive session this environment cannot run. This is a genuine process deviation the requester chose, recorded and reasoned in `AD-024`; it is not a substitute the design triad invented.

## 00. How to read these mockups

Every mockup is self-contained: open the `.html` file directly in a browser
(`file://` works, no server or build step needed). All eight share one
stylesheet, `mockups/tokens.css`, which is the actual reproduction of
`DESIGN.md`'s confirmed Territory-2 delta (two non-player fill roles,
hairline-only boundaries, no shadow outside the player, the two typographic
registers, the border-weight hover/focus/pressed mechanism). Reading
`tokens.css` alongside a screen is the fastest way to verify a component
actually consumes `room`/`panel`/`border`/`border-strong` rather than an
invented one-off value — there are no one-off colors in this stylesheet.

Each mockup carries a `<div class="mockup-meta">` footer note (visually
distinct, dashed rule, not part of the depicted UI) stating exactly which
state is shown and why. This is meta-commentary for the reviewer, not
in-app content, and `design-critic`/`reviewer-design-fidelity` should treat
it as such.

## 01. Screens and mockup files

| Screen / concern | Route(s) | Phase | Mockup file |
|---|---|---|---|
| Header/footer, all contextual-slot states | all 5 routes | 1 (component), 2 (extended) | `mockups/header-footer-states.html` |
| Landing (hero + benefit section + header/footer) | `/` | 1 | `mockups/landing.html` |
| Room identity / setup (host flow) | `/:id/SetupScreen` | 2 | `mockups/room-identity-setup.html` |
| Source selection | `/:id/file-upload` | 2 | `mockups/source-selection.html` |
| Readiness (host pre-play) | `/:id/HostVideoPlayerNew` (pre-play) | 2 | `mockups/readiness.html` |
| Player, windowed, active | `/:id/HostVideoPlayerNew`, `/:id/RecieverVideoPlayerNew` | 2 | `mockups/player-windowed.html` |
| Player, true fullscreen | same | 2 | `mockups/player-fullscreen.html` |
| Player, room ended | same | 2 | `mockups/player-room-ended.html` |

No sixth route or screen is introduced (`01-prd.md` non-goals, `01c-page-strategy.md` §03/§19). The join-flow variant of room identity/setup (name field, "Join and watch," room-not-found error) is not mocked as a separate file — it is the identical component tree and token set as `room-identity-setup.html` with different copy/inputs, not a distinct visual state; re-mocking it would be a duplicate artifact, not new information.

## 02. Information architecture

Unchanged from `01c-page-strategy.md` §03 — five routes, no new one:

```
/                              landing (CAP-1, CAP-2)
/:id/SetupScreen               room identity + media setup (CAP-2, CAP-3)
/:id/file-upload               source selection (CAP-2, CAP-3)
/:id/HostVideoPlayerNew        readiness + host playback (CAP-2, CAP-3)
/:id/RecieverVideoPlayerNew    viewer playback (CAP-2, CAP-3)
```

The shared header/footer (`mockups/header-footer-states.html`) is one
component instance rendered on all five. Its **contextual actions slot**
varies by route:

| Route | Header contextual slot | Footer content |
|---|---|---|
| Landing | "Have a room code?" (secondary button, reveals inline join) | Legal/utility links (Privacy, How it works) |
| Room identity/setup, source-selection, readiness | Room code chip + Invite button | Room-code persistence note + host name |
| Player, windowed | Room code chip + Exit icon button (overlay) | Edge-anchored sync/host status (left) + viewer count (right) — never the horizontal center |
| Player, fullscreen | *(not rendered)* | *(not rendered)* |
| Player, room ended | "Room ended" inert label + Exit icon button | Edge-anchored "Host disconnected" notice |

The header/footer's **identity never varies**: same wordmark position,
same hairline seam, same typography, same `room`/`panel` fills, on every
route. Only the slot content and, on the player specifically, the
layering role (anchored vs. overlay) change — this is `AC-2.1`'s "same
header and footer component" requirement expressed structurally, not just
asserted.

## 03. State matrix

Generic rows, plus this product's rows (`docs/PIPELINE.md`'s required set).
✓ = a named mockup file/section exists for this state; a state matrix row
with no mockup is flagged explicitly, not silently omitted.

| State | Screen(s) | Mockup evidence |
|---|---|---|
| Initial / at rest | Landing, room identity/setup, source-selection | `landing.html`, `room-identity-setup.html`, `source-selection.html` (empty/no-file state) |
| Loading | Source selection (upload in progress) | Not separately mocked — reuses `source-selection.html`'s dropzone/button pattern with the primary action in a `loading` label state; no new visual token is introduced, so a static frame adds no new information beyond what `DESIGN.md`'s existing loading conventions already state |
| Empty | Source selection (no file chosen) | `source-selection.html` |
| Populated | Readiness (source loaded, people present) | `readiness.html` |
| Error / partial failure | Room-not-found (setup), hero media failing to load | Room-not-found: existing `EntryLayout` error card pattern, unchanged by this feature (`setup-screen.tsx:118-137`) — re-skins to `panel`/hairline exactly like every other panel, not separately mocked because it introduces no new component. Hero media failure (`AC-1.3`): `landing.html`'s hero markup itself is the fallback state — headline/copy/CTAs render independently of the placeholder image element, which is exactly what a failed `<img>`/`<video>` collapses to |
| Partial failure | see above | see above |
| Disabled | Source selection primary CTA (no file yet) | `source-selection.html` |
| Long content / overflow | Landing benefit section, readiness now-playing title | Body copy is `70ch`-capped (`.body`); titles truncate via existing `text-wrap`/line-clamp conventions, unchanged by this feature |
| Mobile | All screens | Every mockup's CSS includes a mobile breakpoint (`@media` stacking to one column / hiding the two-column grid); not separately screenshotted per file since the breakpoint is inspectable directly in each file's `<style>` block |
| Keyboard focus | All interactive elements | `tokens.css`'s `:focus-visible` rule (`--focus-ring`, 2px + 2px offset) applies uniformly; not screenshotted per-element since it is one CSS rule, not a per-screen design decision |
| Another member acted concurrently | Readiness (member count badge) | `readiness.html`'s "3 people in the room" badge — this feature does not add new concurrency UI, it re-skins the existing member-count display |
| A member joined mid-playback | Player | Not separately mocked — the player's presence system (`RoomSidebar`) is unchanged by this feature; the header/footer chrome this feature adds has no join-specific state |
| **Host disconnected — room ending** | Player | ✓ `player-room-ended.html` |
| Peer connection degraded | Player | Not separately mocked — `PlayerFeedback`'s existing connection-state UI is unchanged by this feature; only the header/footer chrome around it is new, and it carries no connection-specific content |
| Drift exceeded threshold | Player | Not separately mocked — same reasoning: this feature does not touch `PlayerFeedback`'s drift messaging, only the surrounding chrome |
| **Audio absent, host hasn't pressed play** | Player | Not separately mocked — no header/footer content changes for this state (confirmed N/A by `01-prd.md`'s impact analysis, `PD-008` row) |
| Room at capacity, join refused | Room identity/setup | Not separately mocked — this is existing `setup-screen.tsx` behaviour this feature re-skins without changing; no new chrome content is introduced for it |
| Control is advisory only | All | Not a distinct visual state — `INV-2` is satisfied by omission (no permission-implying UI is added by this feature), not by a state to depict |
| ✓ Fullscreen (`AC-2.3`) | Player | ✓ `player-fullscreen.html` |
| ✓ Idle, header/footer persist (`AC-2.2`) | Player | ✓ `player-windowed.html`'s meta note states this explicitly — capsule/tray would auto-hide on idle; header/footer would not |

Rows without a dedicated mockup file are stated explicitly with the reason (either "this feature introduces no new visual content for this state" or "the state collapses to an already-mocked static frame") rather than silently absent — consistent with `docs/PIPELINE.md`'s "a state matrix row with no corresponding frame is a checklist someone ticked" warning.

## 04. Change inventory (for motion-lead)

Every state change this feature introduces or modifies. `motion-lead` may
animate only items on this list.

| # | What changes | Appears / disappears / moves | From → To | Screens |
|---|---|---|---|---|
| CI-1 | Header/footer visibility on fullscreen toggle | Header + footer appear/disappear as a unit | Visible (windowed) → absent (fullscreen), and back | Player |
| CI-2 | Header/footer room-scoped actions going inert | Room-code chip content + invite button change/disappear | Live room code + Invite button → "Room ended" label, no invite button | Player |
| CI-3 | Landing "Join with a room code" reveal | Inline join form appears below the toggle | Hidden → visible, in place, no layout reflow of the CTA above it | Landing |
| CI-4 | Header's per-route actions slot content | Slot content swaps entirely | "Have a room code?" (landing) → room chip + Invite (room-scoped) → room chip + Exit icon (player) | All 5 routes, at route transitions only — not an in-page animation |
| CI-5 | Landing hero media load failure | Hero background placeholder disappears | Placeholder scene visible → absent, headline/CTA block unaffected either way | Landing |
| CI-6 | Border-weight hover/focus/pressed on any non-player panel, field, button, or popover | Border widens one step; pressed dips opacity briefly | `border` → `border-strong` (hover/focus); resting opacity → briefly reduced (pressed) | All non-player screens |
| CI-7 | Landing benefit-section entrance on scroll into view | Content becomes visible | Not present → present (supporting only, per `01c` §18 — comprehensible without it) | Landing |

Nothing on this list is essential motion by the strict "information
inaccessible without it" test — `01c-page-strategy.md` §18 already
establishes this and this document does not reopen that finding. CI-1/CI-2
are the closest to essential (they are real, stateful events) but are still
fully comprehensible from the end state alone with zero transition.

## 05. Two open questions — resolved

### 05a. What the player-screen footer actually contains

**Resolution**: the player's footer is reduced to two edge-anchored,
low-priority text fragments at the far left and far right of the very
bottom edge — never the horizontal center, which the bottom-center capsule
and reaction tray already own. Left: ambient sync/host status ("Synced ·
Host: Ada", or on room-end, "Host disconnected — this room has ended.").
Right: a minimal viewer-count fragment, or nothing. See
`mockups/player-windowed.html` and `mockups/player-room-ended.html`.

**Why this, and not the alternatives considered**:
- *A full-width bar mirroring the non-player footer's link/status layout* —
  rejected: it would either duplicate the room-code chip already in the
  header (redundant) or introduce new content with nowhere non-competing to
  sit, since the entire horizontal center from roughly 60–90% of viewport
  height up from the bottom is the capsule/tray's territory.
- *No footer at all on the player* — rejected: `AC-2.1` requires the same
  footer component on every route; rendering nothing would mean the
  component doesn't actually render everywhere, only appears to via a
  route-conditional bailout, which is the "footer disappearing somewhere"
  `01c-page-strategy.md` §06 explicitly warns against for the header/footer
  pairing.
- **Trade-off accepted**: the player's footer carries almost no information
  — deliberately. `01c-page-strategy.md` §03 already established the
  player "never ends" the way a marketing page does, so a footer here
  cannot be a resolution beat; making it an ambient, edge-anchored status
  strip is the only version of "the same footer component" that is honest
  about that.

### 05b. Whether "Join with a room code" still reads as the quiet secondary action

**Resolution**: yes, by construction — but only because it is kept
**directly attached beneath the primary CTA inside the hero block**, never
demoted below the fold or moved into a separate section, and it is
rendered exclusively in **Register B** (`body-sm`, underlined text link)
while the primary CTA and headline use Register A (`display`)/the filled
`btn-primary`. See `mockups/landing.html`'s `.join-row`.

**Why this holds under the more editorial hero**: the two-register
typography rule (`01e` §03) is doing the "quiet secondary action" work
that used to depend only on position. Under the old system, "quiet" meant
"visually smaller in the same scale." Under Territory 2's register
ceiling, "Join with a room code" is not just smaller — it is in a
**different register entirely**, one step further from `display` than any
other page-level text on the hero. That is a stronger, more structural
form of subordination than a font-size difference alone, and it survives
regardless of how large or ambitious the primary headline gets, because
Register A's ceiling is fixed independent of Register B's presence.
**Position** answers the "does it stay reachable without scrolling" half
of the original open question (it does — see `01c-page-strategy.md` §09's
own "reachable without scroll" requirement); **register** answers the
"does it stay quiet" half.

## 06. Craft self-assessment — the collapsed elevation model

This is the single largest open craft-execution risk carried through every
upstream stage (flagged in `01d-creative-direction.md` §20 and
`01e-visual-identity.md` §23): **does the flat, hairline-only system read
as "flat and precise" or as "unfinished and un-designed" once actually
built?**

Having built eight real screens against this system, the honest answer is
**mixed, not a clean pass** — and the two open craft questions the pipeline
carried into this stage (`panel`'s hex, and `TextField`'s at-rest
affordance) turn out to be the same finding stated twice.

**Where it reads as precise:**
- Large-format panels (the media-frame previews in `room-identity-setup.html`/`source-selection.html`/`readiness.html`, the checklist/now-playing panels) read cleanly. Enough negative space and enough interior content give the hairline room to do its job — the eye reads "bounded region" correctly on the first look.
- The two-register typography split (landing's `display` vs. everywhere else's `h2` ceiling) is the single strongest signal that this is a *designed* system rather than an undecorated one. It reads as intentional restraint, not absence.
- The player's overlay chrome, being visually identical to the non-player chrome (same hairline language, same fills) but behaviourally different (appears/recedes vs. anchored), genuinely achieves what `01d`'s thesis asked for: "the same object, a different layering role."

**Where it reads as risk, confirmed by building it, not merely inferred:**
- **Small, low-content components — specifically `TextField` and any compact chip/badge — are where the "unfinished" risk actually lands.** A `panel`-fill box with a `border`-weight hairline, at rest, next to another `panel`-fill box with the identical `border`-weight hairline (a `Card`), gives the eye no reason to treat one as "type here" and the other as "read this." `01e`'s own §18/§23 flagged this as an open question ("MAY EXPERIMENT WITH... a narrow third border-weight step") rather than resolving it; having now built it, the answer is not "maybe" — **border-weight alone is insufficient for `TextField`'s at-rest affordance.**
- **`panel`'s hex is legible at the panel/room scale but under-contrasted at the hairline scale specifically.** `border` is `rgba(230,233,238,0.10)` laid over `panel` (`#161b22`); computing the resulting blended edge against the `panel` fill itself gives a contrast ratio in the neighborhood of ~1.3:1 — nowhere near the ~3:1 commonly used for UI-component boundary visibility, even though this isn't running text and isn't bound by the 4.5:1 text floor. Since the hairline is stated as the **only** device separating two flat planes outside the player (`01e` §02, `INVARIANT`), a boundary that measures this faint at rest is a real risk to the system's own central claim, not a nitpick.

**The answer to both carried-forward open decisions, stated directly, not deferred again:**

1. **Does `panel`'s hex need perceptual tuning?** Yes, for small/compact components specifically — not for large panels. Recommend `visual-designer` evaluate a small lightness bump to `panel` (a few percent `L`, not a new hue) **or**, cheaper and preferred, promote `border-strong` (already `18%` opacity, materially better contrast) to be the resting-state boundary for compact interactive controls. The mockups implement the second option already (see below), because it needs no new token or hex value — it reuses an existing, already-`INVARIANT` axis (border weight) rather than opening a new color decision.
2. **Does border-weight alone give `TextField` enough "editable" affordance?** No. The mockups (`room-identity-setup.html`'s field styling in `tokens.css`'s `.field input` rule) implement a concrete fix within the existing rules rather than waiting for a new token: `TextField` renders at **`border-strong`** at rest, while `Card`/`Popover`/other passive containers stay at `border` at rest. This is not a new mechanism — `01e` §11 already establishes border weight as an approved hierarchy axis ("`border-strong` marks an active/focused/emphasized region, `border` marks a resting one") — it is applying that existing axis to solve the exact affordance gap `01e` §23 flagged as unresolved. It does **not** touch `DESIGN.md`'s literal committed component text ("`TextField`... `border` stroke at rest") — that remains what `DESIGN.md` says today. This is flagged here as a **proposed refinement for the next delta-confirmation round**, not a change I have made unilaterally to the confirmed system; `design-critic` should treat the resting-`border-strong` `TextField` styling in these mockups as a live proposal to evaluate, not an already-approved fact.

**Overall verdict**: the system is *closer to* "flat and precise" than "unfinished," but only once the two fixes above are applied — built at face value, exactly as `01e`'s literal text specifies (both `Card` and `TextField` at resting `border`), it tips toward "unfinished," because the one boundary mechanism the whole system depends on is too faint at small scale to reliably read as a boundary at all. This is exactly the kind of finding `01d`/`01e` predicted could only surface once real screens existed — it has now surfaced, with a specific, low-cost fix rather than a request to reopen the territory decision itself.

## 07. Accessibility notes specific to these mockups

- Landmark structure: every mockup uses `<header>`/`<main id="main-content">`/`<footer>` in that order — verifies `01c-page-strategy.md` §15's "tab order flows header → main → footer without a trap" at the markup level; a real implementation must confirm this holds once React Router's route transitions are wired in, which these static files cannot test (`AD-024`'s stated limitation).
- Contrast: `ink` on `room`/`panel` and `on-brand` on `brand` are unchanged numeric values from `DESIGN.md`'s already-verified table — not re-measured here since no new hex was introduced for text-on-fill pairings. The one contrast concern this stage surfaces is the **non-text** hairline-boundary contrast noted in §06, which is a distinct claim from the AA text-contrast floor and does not regress it.
- Reduced motion: no mockup encodes any animation (these are static frames by construction), so `prefers-reduced-motion` compliance is `motion-lead`'s and the eventual implementation's to verify against `02b-motion.md`, not demonstrable from a static artifact — stated plainly per `AD-024`'s own limitation, not implied.
- Touch targets: every button/icon-button in `tokens.css` (`.btn`, `.player-icon-btn`, `.reaction-tray`) is sized at or above 44×44 CSS px (`2.75rem` = 44px) — verified by the literal CSS values, not by rendering.
- Focus visibility: `tokens.css`'s single `:focus-visible` rule applies uniformly; the player's fullscreen-hide behavior (`AC-2.3`) has no keyboard-focus test possible from a static mockup — flagged as a `reviewer-design-fidelity`-stage concern against the real implementation, consistent with `01c-page-strategy.md` §15's own flag.

## 08. What design-critic can and cannot check here

Per `AD-024`: these are static HTML/CSS files, not a Figma file with
layers/variants/prototype links. `design-critic` can inspect: whether
`room`/`panel`/`border`/`border-strong` are actually the only fills/
boundaries used (grep `tokens.css` and each file's inline styles — there
are no other color literals in this artifact), whether the two typographic
registers are actually enforced (search for `.display`/`.h2` usage — no
file uses `.display` outside `landing.html`), whether the state matrix's
claimed mockup coverage is real (open each linked file), and whether the
change inventory's claims match what's visually present. `design-critic`
**cannot** here: tab-test real keyboard navigation, run a console check,
measure under actual `prefers-reduced-motion` media query toggling in a
live app, or inspect a Figma prototype-link flow — those checks move to
`reviewer-design-fidelity` against the real built implementation, exactly
as `docs/PIPELINE.md`'s Figma-file section anticipates for a static
artifact, applied here to HTML instead of Figma frames.
