---
version: alpha
name: Sync Party — Dark Cinema
description: A modern dark streaming aesthetic for The Sync Party. The video is the stage; a low-contrast cinematic shell frames it, with a warm red accent and a hand-drawn script brand mark carrying the personality.
colors:
  bg: "#0d1117"
  surface: "#161b22"
  surfaceRaised: "#1c222b"
  surfaceSunken: "#0a0e13"
  ink: "#e6e9ee"
  inkMuted: "#aeb6c2"
  inkFaint: "#7d8794"
  brand: "#f85149"
  brandHover: "#ff6a61"
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
    fontFamily: Yesteryear
    fontSize: 3.5rem
    fontWeight: 400
    lineHeight: 1.15
    letterSpacing: 0.01em
  brandName:
    fontFamily: Yesteryear
    fontSize: 1.75rem
    fontWeight: 400
    lineHeight: 1.2
  h1:
    fontFamily: Overpass
    fontSize: 2rem
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: -0.01em
  h2:
    fontFamily: Overpass
    fontSize: 1.5rem
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: -0.01em
  h3:
    fontFamily: Overpass
    fontSize: 1.125rem
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: Overpass
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.6
  bodySm:
    fontFamily: Overpass
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
  caption:
    fontFamily: Overpass
    fontSize: 0.75rem
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: 0.02em
  mono:
    fontFamily: Overpass
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
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  xxxl: 64px
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

# Sync Party — Dark Cinema

A modern dark streaming aesthetic. The video is the stage: the app shell is a quiet,
low-contrast dark room; the red accent and the hand-drawn script brand mark provide
the warmth and personality. Chrome appears on demand and recedes so the watching
feels shared, immediate, and cinematic.

## Color

**Strategy — committed.** A saturated brand red carries the identity; the surface stays
a neutral near-black so the red reads as pigment, not atmosphere. The mood lives in the
accent and typography, not the background.

### Scene

A friend in a dark room at night, phone or laptop glow on their face, watching a movie
with three other people on their own screens. Dim, focused, cinematic. That scene forces
dark: bright surfaces would glare in the room and fight the video.

### Roles

- **bg `#0d1117`** — the room. Pure near-black, chroma 0. The film-grain baseline.
- **surface `#161b22` / raised `#1c222b` / sunken `#0a0e13`** — the furniture: panels,
  cards, inputs. Raised for controls and popovers, sunken for the video well and inputs.
- **ink `#e6e9ee`** — primary text. Cool-tinted white, never pure (avoids glare).
- **inkMuted `#aeb6c2` / inkFaint `#7d8794`** — secondary + placeholder text. `inkFaint`
  is only for truly secondary content; body text never falls below `inkMuted`.
- **brand `#f85149`** — the red accent: primary actions, focus, the active state, the
  playhead. Warm and confident, the only saturated color on screen most of the time.
- **brandMuted / brandSoft** — tinted fills for active chips, hover wells, selection.
- **success / warning / danger** — status only (connection, rate limit, errors). Never
  decorative.
- **onBrand `#ffffff`** — text on the brand button (contrast ~4.6:1 against `#f85149`).

### Contrast

- Body `ink` on `bg` ≈ 12.9:1; `inkMuted` on `bg` ≈ 6.9:1 — comfortably past AA.
- `inkMuted` on `surface` ≈ 5.9:1; placeholder `inkFaint` on `surface` ≈ 4.4:1 (≥4.5 target
  on the most common field surfaces — if a field sits on `surfaceSunken`, use `inkMuted`
  for placeholders there).
- `onBrand` on `brand` ≈ 4.6:1 — meets AA for normal text and icons.
- `brand` as text on `bg` ≈ 4.8:1 — usable for links and the active tab label.

## Typography

**Contrast axis: script × mono.** Yesteryear (hand-drawn script) carries the brand mark
and display moments; Overpass (humanist mono) carries everything else — body, headings,
labels. One family in multiple weights keeps the UI quiet; the script is the only
"decorative" voice and is used sparingly (brand mark, empty-state warmth).

- Body copy capped at ~70ch. `text-wrap: pretty` on prose.
- Display heading ceiling: the brand name maxes at `clamp(2.5rem, 6vw, 4rem)`; section
  headings never exceed 2rem. Letter-spacing floor −0.01em (the mono doesn't tolerate
  tighter).
- `text-wrap: balance` on h1–h3.
- All type is Overpass unless noted; the script is reserved for the brand.

## Layout

- **The stage model.** The video is centered; controls and the sidebar are overlays that
  appear on interaction and recede after a beat. The shell is `flex flex-col` with the
  player in the middle and the chrome at the edges — no competing columns during playback.
- On the pre-play surfaces (home, setup, upload) content is centered with generous
  vertical rhythm; spacing alternates `md → xl → xxl` to avoid a uniform grid.
- Semantic z-index scale: `overlay(10) → dropdown(20) → sticky(30) → modal-backdrop(40)
  → modal(50) → toast(60) → tooltip(70)`. No 999s.

## Motion

- Reveal/entrance: ease-out-expo `cubic-bezier(0.16, 1, 0.3, 1)`, ~300–450ms, staggered
  within lists only. Controls fade/slide in on interaction.
- Never animate layout properties. Use transform + opacity + blur.
- **`prefers-reduced-motion`**: every animation collapses to a ≤120ms crossfade or
  instant state. Non-negotiable.

## Interaction

- Playback controls, chat, and reactions are fully keyboard-operable; focus ring is the
  `brand` color at 2px with a 2px transparent gap.
- Popovers/overlays use the native `<dialog>`/popover API (or `position: fixed`) so they
  escape `overflow` clipping inside the player shell.
- Hover on dark surfaces: raise surface +0.04 L or show a 1px `borderStrong`; never rely
  on color alone.

## Components

- **UnifiedButton** — `brand` fill (primary) or `surface` with `borderStrong` (secondary);
  radius `md`; mono 0.875rem/600. Active: `brandHover`. Focus: `focusRing` ring.
- **TextField** — `surfaceSunken` fill, `border` stroke, `ink` text, mono. Focus lifts the
  fill to `surface` and applies a `focusRing` ring. Placeholder: `inkFaint` on sunken,
  `inkMuted` on raised.
- **Popover** — `surfaceRaised` fill, `borderStrong` stroke, `lg` radius, `overlay`
  shadow; uses the native popover API.
- **PlayerShell** — the stage. Video fills; a gradient scrim (`overlay`) fades controls
  in/out. Progress = `brand` playhead on a `borderStrong` track.
- **Card** — reserved for genuinely useful groupings (member list, host controls). No
  nested cards, no icon-card grids.

## Rules of thumb

- The red accent is the only saturated color in normal use. If a surface needs two
  saturated colors, the design is off — pull back to neutrals.
- No glassmorphism, no gradient text, no side-stripe borders, no uppercase-tracked
  eyebrows over every section.
- Empty states carry the script voice (a line of Yesteryear) to keep the app warm when
  there's no video yet.
