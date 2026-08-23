---
version: alpha
name: Sync Party — Dark Cinema
description: A Native TV-inspired dark cinema system for The Sync Party. The video is the stage; a low-contrast shell frames it, with a warm red accent and an Avenir-style sans wordmark carrying the personality.
colors:
  bg: "#0d1117"
  surface: "#161b22"
  surfaceRaised: "#1c222b"
  surfaceSunken: "#0a0e13"
  ink: "#e6e9ee"
  inkMuted: "#aeb6c2"
  inkFaint: "#7d8794"
  brand: "#d93036"
  brandHover: "#e5484d"
  brandText: "#f85149"
  brandMuted: "color-mix(in srgb, #f85149 18%, #161b22)"
  brandSoft: "color-mix(in srgb, #f85149 10%, #0d1117)"
  success: "#3fb950"
  warning: "#d29922"
  danger: "#f85149"
  focusRing: "#f85149"
  overlay: "rgba(6, 8, 12, 0.72)"
  selection: "rgba(248, 81, 73, 0.35)"
  onBrand: "#ffffff"
  border: "rgba(230, 233, 238, 0.10)"
  borderStrong: "rgba(230, 233, 238, 0.18)"
typography:
  display:
    fontFamily: "Avenir Next", "Helvetica Neue", system-ui, sans-serif
    fontSize: clamp(2.5rem, 5vw + 1rem, 3.5rem)
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -0.04em
  brandName:
    fontFamily: "Avenir Next", "Helvetica Neue", system-ui, sans-serif
    fontSize: 1.75rem
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -0.04em
  h1:
    fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif
    fontSize: 2.25rem
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.03em
  h2:
    fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif
    fontSize: 1.5rem
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: -0.01em
  h3:
    fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif
    fontSize: 1.125rem
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.6
  bodySm:
    fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif
    fontSize: 0.75rem
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0.02em
  mono:
    fontFamily: ui-monospace, SFMono-Regular, Menlo, monospace
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
rounded:
  xs: 4px
  sm: 6px
  md: 10px
  lg: 16px
  full: 9999px
spacing:
  xxs: 4px
  xs: 8px
  sm: 16px
  md: 24px
  lg: 32px
  xl: 40px
  xxl: 48px
  xxxl: 64px
  display: 80px
components:
  button:
    borderRadius: "{rounded.md}"
    paddingX: "{spacing.md}"
    paddingY: "{spacing.sm}"
  card:
    borderRadius: "{rounded.lg}"
    padding: "{spacing.lg}"
    background: "{colors.surface}"
  input:
    borderRadius: "{rounded.md}"
    paddingX: "{spacing.md}"
    paddingY: "{spacing.sm}"
    background: "{colors.surfaceSunken}"
---

# Sync Party — Native TV Dark Cinema

A Native TV-inspired product system. The video is the stage: the app shell is a
quiet, low-contrast dark room; the red accent and Avenir-style sans wordmark
provide warmth and personality. Chrome appears on demand and recedes so the
watching feels shared, immediate, and cinematic.

## Color

**Strategy — committed.** A saturated brand red carries the identity; the
surface stays a neutral near-black so the red reads as pigment, not atmosphere.
The mood lives in the accent and typography, not the background.

### Scene

A friend in a dark room at night, phone or laptop glow on their face, watching a
movie with three other people on their own screens. Dim, focused, cinematic.
That scene forces dark: bright surfaces would glare in the room and fight the
video.

### Roles

- **bg `#0d1117`** — the room. Pure near-black, chroma 0. The film-grain
  baseline. Outside `PlayerShell`, this role is also called **`room`**: the page
  background every non-player screen's chrome is built into.
- **surface `#161b22`** — the flat plane every bounded region outside the player
  uses: `Card`, `TextField`, `Popover`. Outside `PlayerShell`, this role is also
  called **`panel`**. A `panel` is distinguished from `room` by a hairline
  (`border`/`borderStrong`), never by being visually "lighter" in a way that
  reads as lifted or raised — nothing outside the player casts a shadow or sits
  on an elevated fill. See "Non-player surface model" below.
- **raised `#1c222b` / sunken `#0a0e13`** — scoped exclusively to
  `PlayerShell`'s existing stage model: raised for controls and popovers over
  the video, sunken for the video well. These are not used by any non-player
  chrome, panel, or input.

### Non-player surface model

Outside `PlayerShell`, the surface system is flat: exactly two fill roles,
`room` and `panel`, both reusing the existing `bg`/`surface` values above with
no new hex introduced. A region is set apart from its background by a **1px
hairline** (`border` at rest, `borderStrong` on hover/focus/active emphasis),
never by a lighter fill, a shadow, or a blur. If a component reaches for
`box-shadow` or a lighter background to "lift" itself outside the player, this
rule has been violated. No third non-player fill role may be introduced to
express relative importance — hierarchy outside the player is carried by ink
contrast, border weight, spacing, and the single `brand` accent, never by a
panel being a lighter shade than another panel of the same role.

`PlayerShell`'s existing overlay/stage model (video anchored, capsule/tray/
popovers, `raised`/`sunken` fills, the gradient scrim) is unchanged and exempt
from this rule — it is depth relative to the video, not a chrome-elevation
system.

### Landing marketing surface (second exemption)

`LandingScreen` (the pre-room page at `/`) is a second, explicit exemption from
the non-player surface model — a committed warm-cinema mood, not a themeable
panel, the same way `PlayerShell` is a committed stage rather than a themeable
panel. It does not follow `html.light`; its tokens are fixed regardless of the
site-wide theme toggle.

**One accent, warm neutrals, dark only in the hero.** Every other landing color
is a named neutral; `landing-ember` is the one saturated color on the page.
Every value below is checked against the specific surface it sits on — see
"Contrast" for the readings used to decide where each color is allowed.

- **landing-paper `#FBF1E2`** — page base for every section below the hero.
  Replaces `bg`/`surface` on this page only.
- **landing-paper-raised `#F4E7D2`** — one step warmer than `landing-paper`, for
  feature cards and any region that wants separation without a border alone
  (still no shadow — the separation is the color step itself, scoped to this
  page's own exemption, not the app-wide "border, not elevation" rule).
- **landing-ink `#1E1712`** — primary text on `landing-paper`. 16.9:1 contrast.
- **landing-ink-soft `#3A2F26`** — secondary text/body copy where `landing-ink`
  would be too heavy (subtext, captions at normal reading size).
- **landing-clay-deep `#6B5F4C`** — muted text (eyebrows' non-color state,
  metadata). 5.6:1 on `landing-paper` — passes AA body text.
- **landing-clay `#D8C9AE`** — hairline borders only, never text. Deliberately
  low-contrast against `landing-paper` — it is a border, not a message.
- **landing-ember `#FF4429`** — the one accent: CTA hover/press color, section
  eyebrows, the footer wordmark's "Party." 3.1:1 on `landing-paper` — large
  text/icons/borders only, never small body text or link color on the light base
  (use `landing-ink` or `landing-ink-soft` for those; reserve ember for
  headline-scale or iconographic use). 5.77:1 on `landing-dusk` — reads fine as
  text/glow on the hero.
- **landing-dusk `#120D0A`** — the hero stage only. Nothing outside the hero
  uses this color; it is not a second "dark mode" for the page, it is the one
  cinematic surface running underneath the video.
- **landing-dusk-raised `#201812`** — hero chrome that sits above the stand-in
  scene (join-reveal panel, if shown over the hero rather than below it).
- **landing-dusk-ink `#FBF1E2`** (= `landing-paper`, reused as the inverse ink)
  — text on `landing-dusk`. 17.9:1 contrast.
- **landing-dusk-ink-soft `#C9BBA4`** — secondary text on `landing-dusk` (hero
  subtext).

### Landing typography (second exemption)

The landing page uses its own two-role type system instead of the app-wide
Native TV sans, matching its own committed exemption:

- **Bricolage Grotesque** (variable, weight 200–800, self-hosted) — display
  role: the hero headline and every section heading on this page. Set uppercase,
  weight 700–800, tight tracking (−0.02em to −0.04em), at Apple-product-page
  scale (`clamp(2.5rem, 6vw, 4.5rem)` for the hero headline, capped lower for
  section heads — see the component rules below).
- **Karla** (variable, weight 200–800, self-hosted) — body role: subtext,
  feature/showcase copy, footer/info copy. Never carries the display role; never
  drops below 0.875rem on this page.
- The app-wide monospace role is still used for technical/label text (room-code
  style eyebrows, showcase captions where a technical register fits) — unchanged
  from the rest of this document.

### Landing motion: the scroll-scrubbed hero

The hero is a **scroll-scrubbed stage**, not an autoplay loop: a tall (`300vh`)
track holds a sticky (`100vh`) stage, and scroll position — not a timer — drives
the stage's zoom, grade, and headline reveal, from a settled wide shot at 0% to
an arrived, in-focus frame at 100%. The mechanism is scroll position mapped
directly to CSS custom properties on the stage element (no React re-render per
scroll tick — see [why](DECISION.md#d-004)), never a `<video>` `currentTime`
scrub yet: the stage currently renders a CSS gradient/grain stand-in scene in
place of a licensed clip, with the same custom properties (`--scrub-scale`,
`--scrub-sat`, `--scrub-bright`, `--scrub-scrim`, `--scrub-text-op`) a real
`<video>` swap would drive (see [why](DECISION.md#d-001)).

Once scrolled past, the sticky stage releases naturally into the page below — no
JS hand-off. Sections below the hero (`LandingFeatures`, `LandingShowcase`) use
the document's standard fade-up-on-view reveal (300–450ms `ease-out-expo`,
`whileInView`, once) — the hero's scroll-linked mechanism is never reused past
the hero itself.

**Forbidden on this page:** bounce/elastic/spring-overshoot easing on any
scroll-linked value, auto-looping decorative motion (no idle blobs, no floating
shapes — the previous gold/teal decorative blobs are removed entirely,
[why](DECISION.md#d-003)), and scroll-scrubbing anything past the one hero
moment.

The hero's own content (headline/subtext/CTA/avatars) still enters once via the
shared spring (`stiffness: 260, damping: 24, mass: 1`, staggered 70ms/item); the
CTA keeps its squash-and-stretch press spring
(`stiffness: 500, damping: 15, mass: 0.9`). Both collapse to a 100ms opacity
fade under `prefers-reduced-motion`, and the scroll-scrub mechanism itself is
skipped entirely under reduced motion — the hero renders its settled 100% state
immediately with no scroll listener attached.

**Below the hero, the page turns down the volume.** The hero is the one dark,
cinematic moment on the page. Every section below it (features, screenshots,
info, footer) runs on the warm `landing-paper` base and this document's normal
single-accent discipline: `landing-ember` only, used sparingly (large text,
icons, hover states), no second saturated color anywhere on this page. Feature
cards use `landing-paper-raised` fills with a hairline border. Real product
screenshots are framed with a hairline border and small radius, no drop shadow,
so they read as evidence, not as a glossy mockup.

### Landing copy: one deadpan register, used narrowly

The "About/Help/Sources" info grid and the footer tagline use a dry,
understated, slightly-too-formal register — a company-memo wink, not a joke
repeated everywhere ([why](DECISION.md#d-005)). The hero headline, feature copy,
and showcase captions keep the page's normal warm/direct voice unchanged.
Example of the register, applied only where D-005 scopes it: "The connection was
lost. This has been noted." rather than "Oops! Something went wrong."

- **ink `#e6e9ee`** — primary text. Cool-tinted white, never pure (avoids
  glare).
- **inkMuted `#aeb6c2` / inkFaint `#7d8794`** — secondary + placeholder text.
  `inkFaint` is only for truly secondary content; body text never falls below
  `inkMuted`.
- **brand `#d93036`** — the red accent for filled buttons and the playhead:
  white text on it hits 4.74:1 (AA). Warm and confident.
- **brandText `#f85149`** — a lighter red for brand-colored _text_ (links,
  active tab labels, icons): 5.65:1 on `bg` (AA). Buttons use the darker `brand`
  so white text passes.
- **brandMuted / brandSoft** — tinted fills for active chips, hover wells,
  selection.
- **success / warning / danger** — status only (connection, rate limit, errors).
  Never decorative.
- **onBrand `#ffffff`** — text on the brand button (contrast 4.74:1 against
  `brand
  #d93036`).

These are semantic roles, not component-specific colors: brand identifies
primary action and identity; surface, raised, and sunken establish depth; ink
and muted ink establish reading hierarchy; border separates; focus identifies
keyboard position; success, warning, and danger communicate status. New UI must
consume these roles instead of introducing one-off colors.

### Contrast

- Body `ink` on `bg` ≈ 12.9:1; `inkMuted` on `bg` ≈ 6.9:1 — comfortably past AA.
- `inkMuted` on `surface` ≈ 5.9:1; placeholder `inkFaint` on `surface` ≈ 4.4:1
  (≥4.5 target on the most common field surfaces — if a field sits on
  `surfaceSunken`, use `inkMuted` for placeholders there).
- `onBrand` on `brand` ≈ 4.74:1 — meets AA for normal text and icons.
- `brandText` on `bg` ≈ 5.65:1 — usable for links and the active tab label.
- `brand` as text on `bg` ≈ 3.99:1 — for large/bold display only; use
  `brandText` for normal-size text.

## Typography

**Three roles: brand wordmark × Native TV UI × restricted monospace.** The
Avenir-style sans treatment carries the brand mark; an Apple/SF-style system
sans carries headings, body copy, labels, and controls; the monospace role is
reserved for room codes, technical metadata, timestamps, and other values whose
character alignment improves scanning. One role must not be substituted for
another to create decoration.

- Body copy capped at ~70ch. `text-wrap: pretty` on prose.
- Display heading ceiling: the brand name maxes at `clamp(2.5rem, 6vw, 4rem)`;
  section headings never exceed 2.25rem. Letter-spacing floor −0.04em for
  display type; the mono doesn't tolerate tighter.
- `text-wrap: balance` on h1–h3.
- Product UI uses the system sans unless noted; the Avenir-style treatment is
  reserved for the wordmark; monospace is reserved for technical values.
- **Two typographic registers.** `display` and `h1` are reserved for the landing
  hero headline only — a title-card moment, not a page heading — and
  `display.fontSize` is fluid (`clamp(2.5rem, 5vw + 1rem, 3.5rem)`). Every other
  page-level or section heading (wordmark excepted) ceilings at `h2`; most
  in-screen section headings should reach for `h3` instead. This ceiling rule is
  deliberate, not an oversight: it keeps the product's task screens and chrome
  plainspoken and precise while the landing hero is allowed to be the one
  editorial moment in the system.
- **Monospace, expanded scope.** Beyond room codes and technical metadata, the
  restricted monospace role also carries short state labels (readiness,
  connection, sync status) on the player and readiness screens specifically. It
  is not used more broadly than that — monospace must never substitute for the
  system sans on running prose (setup and source-selection states remain
  system-sans body copy).

## Layout

- **The stage model.** The video is centered; controls and the sidebar are
  overlays that appear on interaction and recede after a beat. The shell is
  `flex flex-col` with the player in the middle and the chrome at the edges — no
  competing columns during playback.
- On the pre-play surfaces (home, setup, upload) content is centered with
  generous vertical rhythm; spacing alternates `md → xl → xxl` to avoid a
  uniform grid.
- Use the 8pt spacing scale as the only rhythm: `xxs` is the 4px optical
  correction, then `xs/sm/md/lg/xl/xxl/xxxl/display` resolve to the 8px grid.
  Use `xs/sm` for internal controls, `md/lg` for component padding and related
  groups, and `xl/xxl/xxxl/display` for major composition. Do not use large
  section gaps for tightly related controls.
- A primary workspace holds the main task or video; secondary context holds room
  identity, participant, or supporting information; preview areas show readiness
  before commitment; action areas contain the next decision. Keep these roles
  visually distinct and let the primary workspace dominate.
- Cards represent a meaningful interaction or a coherent information group. Use
  the existing `Card` treatment for that purpose only; do not build decorative
  card mosaics, nested card stacks, or one-card-per-sentence grids.
- Responsive composition is intentional: mobile prioritizes one task column and
  reachable actions; tablet balances the workspace with supporting context;
  desktop may place secondary context beside the workspace when it does not
  reduce the stage. At every width, preserve reading order, room identity, and
  the dominant next action.
- Semantic z-index scale:
  `overlay(10) → dropdown(20) → sticky(30) → modal-backdrop(40)
  → modal(50) → toast(60) → tooltip(70)`.
  No 999s. Anchored, non-player chrome (see "Chrome anchoring" below)
  participates in normal document flow and needs no z-index assignment; the
  `overlay` tier is consumed only by the player's overlay chrome and by genuine
  dropdown/modal/toast/tooltip layers on any route.

### Chrome anchoring

The shared header and footer are part of the page's own document flow on every
route except the player — separated from body content by a single hairline, not
`position: fixed` or floating with their own elevation. On the player, header
and footer remain overlays that appear and recede with the rest of the playback
chrome (see "Motion" and `PlayerShell`, below); the component is the same one
everywhere, only its layering role differs by route.

- The approved player is the centered-controls model: a compact bottom-center
  capsule owns playback and room-tool entry, quick reactions sit above it, and
  deeper social context opens from a contextual menu. The capsule has a stable
  control order across host and receiver roles.

## Motion

- Reveal/entrance: ease-out-expo `cubic-bezier(0.16, 1, 0.3, 1)`, ~300–450ms,
  staggered within lists only. Controls fade/slide in on interaction.
- Never animate layout properties. Use transform + opacity + blur.
- **`prefers-reduced-motion`**: every animation collapses to a ≤120ms crossfade
  or instant state. Non-negotiable.
- Motion must communicate hierarchy, cause and effect, progress, or a state
  transition. Decorative motion is limited and must never delay comprehension,
  cover content, or compete with playback.

## Interaction

- Playback controls, chat, and reactions are fully keyboard-operable; focus ring
  is the `brand` color at 2px with a 2px transparent gap.
- Popovers/overlays use the native `<dialog>`/popover API (or `position: fixed`)
  so they escape `overflow` clipping inside the player shell.
- Hover on dark surfaces, **player only**: raise surface +0.04 L or show a 1px
  `borderStrong`; never rely on color alone.
- Hover/focus/pressed on non-player chrome (`Card`/`TextField`/`Button`
  secondary/`Popover`): no fill change of any kind. Hover steps the border from
  `border` to `borderStrong`; pressed is a brief, small opacity reduction on the
  element itself; focus is the existing `focusRing`, unchanged. There is no
  "raise the surface" state outside the player — nothing outside it has
  elevation left to lift.
- Every interactive pattern has an observable hover, focus, pressed, disabled,
  loading, success, error, and reduced-motion treatment where applicable.
  Loading preserves the action's context, disabled explains its prerequisite,
  and success/error appears next to the affected control or content.
- Empty, loading, error, and success states state what is happening and what the
  user can do next. A state is incomplete if the user must infer whether the
  room, source, connection, or playback is ready.

## Accessibility

- Meet WCAG AA contrast: at least 4.5:1 for normal text and 3:1 for large text,
  meaningful icons, and focus indicators against their adjacent surface.
- Use semantic landmarks and headings in reading order. Every control has a
  visible label or an explicit accessible name; labels are not duplicated for
  the same concept and placeholders never replace labels.
- All functionality works with keyboard input, including playback, room sharing,
  chat, reactions, dialogs, and popovers. Focus is visible, ordered, not trapped
  unexpectedly, and never obscured by overlays.
- Interactive targets are touch-friendly (minimum 44×44 CSS px where practical)
  with adequate spacing. Do not rely on hover for essential information.

## Brand and content

- Logos, illustrations, icons, colors, copy, and imagery must share one
  cinematic/social identity: warm red accent, quiet dark surfaces, human
  typography, and restrained playful details. New assets need a product reason,
  not decoration for its own sake.
- Use one consistent term per concept, remove copy that does not help the task,
  and make the next action explicit. Feedback should be specific to the room,
  source, connection, or playback state rather than generic system language.

## Components

- **UnifiedButton** — primary: `brand` fill; radius `md`; mono 0.875rem/600.
  Active: `brandHover`. Focus: `focusRing` ring. Secondary, **non-player**: no
  fill (transparent against `room`/`panel`), `border` stroke at rest,
  `borderStrong` on hover/focus/pressed — no fill change at any state.
  Secondary, **player**: unchanged from the existing `surface`-fill treatment.
- **TextField**, **non-player** — `panel` fill, `border` stroke at rest, `ink`
  text, mono. Focus is `borderStrong` + the existing `focusRing`; the fill does
  not change on focus — there is no sunken well outside the player. Placeholder:
  `inkMuted` on `panel`.
- **TextField**, **player** — unchanged: `surfaceSunken` fill, focus lifts to
  `surface`, as before.
- **Popover**, **non-player** — `panel` fill, `border` stroke at rest /
  `borderStrong` on open, `lg` radius, **no shadow**; uses the native popover
  API.
- **Popover**, **player** — unchanged: `surfaceRaised` fill, `borderStrong`
  stroke, `overlay` shadow.
- **PlayerShell** — the stage. Unchanged by the non-player surface model above.
  Video fills; a gradient scrim (`overlay`) fades controls in/out. Progress =
  `brand` playhead on a `borderStrong` track.
- **Card** — **non-player**: `panel` fill, `border` stroke at rest /
  `borderStrong` on hover/focus/active, no shadow. Reserved for genuinely useful
  groupings (member list, host controls). No nested cards, no icon-card grids,
  no fill-lightening to signal emphasis — use border weight, ink contrast, or
  spacing instead.

## Photography and video

When this product uses real photographic imagery, it depicts a subject lit only
by the motivated glow of a screen or lamp — no added studio light, no
colour-graded gradient overlay, no visible screen content, no AI-generated human
subjects. Reality level: hyperreal-but-plausible, never a produced "film still."
The subject is never posed toward camera; framing is candid and observational,
as if caught rather than arranged for a lens.

Photographic imagery, where used, carries no frame device of its own — no card,
shadow, border, or vignette. It is full-bleed content, not chrome: alongside the
video on the player, it is the only element permitted to run edge-to-edge and
unbounded. Everything else in the product is a closed, hairline-bounded region
(see Color's "Non-player surface model").

The landing hero's video follows the same reality level
(hyperreal-but-plausible, candid framing, no visible screen content) once a real
clip replaces the stand-in scene: people watching a shared screen together, lit
by its glow, never posed toward camera. It runs full-bleed and unbounded like
player video, and is the only place on the landing page permitted to be
scroll-scrubbed (see "Landing motion: the scroll-scrubbed hero").

## Design review checklist

Before accepting a screen or shared component, verify:

- hierarchy makes the current location, primary goal, and next action obvious;
- copy and feedback explain current state and recovery without inference;
- spacing uses the scale, grouping is coherent, and text does not overlap;
- mobile, tablet, and desktop compositions preserve task order and context;
- semantic structure, labels, accessible names, keyboard paths, focus, contrast,
  and touch targets are usable;
- hover, focus, pressed, disabled, loading, success, error, empty, and
  reduced-motion states are covered where applicable;
- brand assets and surfaces feel like one cinematic/social system;
- perceived performance is stable: no avoidable layout shift, blocked action, or
  unexplained delay.

## Rules of thumb

- The red accent (`brand` in the product, `landing-ember` on the landing page)
  is the only saturated color in normal use, everywhere in this system including
  the landing marketing surface (see "Landing marketing surface" under Color) —
  its own committed palette differs in base color and mood, not in the
  single-accent discipline. If a surface needs two saturated colors, the design
  is off — pull back to neutrals.
- No glassmorphism, no gradient text, no side-stripe borders, no
  uppercase-tracked eyebrows over every section.
- Outside the player, nothing floats. If a component reaches for a shadow or a
  lighter "raised" fill to separate itself from the room, that's the elevation
  model this system replaced — use a hairline (`border`/`borderStrong`) instead.
  Two non-player fill roles only (`room`, `panel`); a design that needs a third
  to feel legible has not actually flattened.
- Empty states use warm, plain-language copy and the approved system/wordmark
  typography; avoid introducing a separate decorative script role.
- Avoid AI-slop patterns: generic SaaS card grids, uniform rounded cards,
  excessive decorative gradients, unexplained illustrations, centered-everything
  layouts, and generic marketing copy. If a visual element does not clarify the
  task, state, or brand, remove it.
