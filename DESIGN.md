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
    fontSize: 3.5rem
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
  baseline.
- **surface `#161b22` / raised `#1c222b` / sunken `#0a0e13`** — the furniture:
  panels, cards, inputs. Raised for controls and popovers, sunken for the video
  well and inputs.
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

**Three roles: brand wordmark × Native TV UI × restricted monospace.**
The Avenir-style sans treatment carries the brand mark; an Apple/SF-style system
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
  No 999s.

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
- Hover on dark surfaces: raise surface +0.04 L or show a 1px `borderStrong`;
  never rely on color alone.
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

- **UnifiedButton** — `brand` fill (primary) or `surface` with `borderStrong`
  (secondary); radius `md`; mono 0.875rem/600. Active: `brandHover`. Focus:
  `focusRing` ring.
- **TextField** — `surfaceSunken` fill, `border` stroke, `ink` text, mono. Focus
  lifts the fill to `surface` and applies a `focusRing` ring. Placeholder:
  `inkFaint` on sunken, `inkMuted` on raised.
- **Popover** — `surfaceRaised` fill, `borderStrong` stroke, `lg` radius,
  `overlay` shadow; uses the native popover API.
- **PlayerShell** — the stage. Video fills; a gradient scrim (`overlay`) fades
  controls in/out. Progress = `brand` playhead on a `borderStrong` track.
- **Card** — reserved for genuinely useful groupings (member list, host
  controls). No nested cards, no icon-card grids.

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

- The red accent is the only saturated color in normal use. If a surface needs
  two saturated colors, the design is off — pull back to neutrals.
- No glassmorphism, no gradient text, no side-stripe borders, no
  uppercase-tracked eyebrows over every section.
- Empty states use warm, plain-language copy and the approved system/wordmark
  typography; avoid introducing a separate decorative script role.
- Avoid AI-slop patterns: generic SaaS card grids, uniform rounded cards,
  excessive decorative gradients, unexplained illustrations, centered-everything
  layouts, and generic marketing copy. If a visual element does not clarify the
  task, state, or brand, remove it.
