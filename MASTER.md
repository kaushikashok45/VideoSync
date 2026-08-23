---
version: 1.0
name: Afterglow — VideoSync monochrome dark system
description: >
  A pure-black, monochrome Vercel/Geist-style design system (Tailark "Dusk"
  block structure) applied app-wide — landing/marketing and in-room/player UI.
  Color is confined to a single muted signal-blue (focus rings, live-status)
  and to contained gradient-mesh imagery; everything else is black, white,
  and gray. Supersedes the dark-cinema red-brand system (see DECISION.md
  D-006, docs/DECISIONS.md PD-025, docs/BRAND-STRATEGY.md INV-4 v2.0).
status: approved — visual + interaction thesis validated via artifact preview
---

## Visual thesis

A pure-black, monochrome Vercel/Geist canvas — true black chrome, white text and
white pill buttons, a gray scale in between, and no accent color anywhere in the
interface itself; the only color on the page lives inside contained
gradient-mesh mockup panels, exactly as Tailark's Dusk block confines its color
to the app-preview image. A single muted signal blue appears only for focus
rings and live-status dots.

## Interaction thesis

Medium-fast transitions (150–280ms, ease-out). Buttons and cards respond to
hover with a subtle scale (1.02–1.03) plus a whitening glow instead of a hard
color swap. Scroll reveals content with a gentle fade-and-rise with light
stagger. Forbidden: bounce/elastic springs, skeuomorphic drop-shadows,
confetti/cartoon effects, glassmorphism, gradient text, more than one saturated
accent in normal use.

## Color

RGB triplets (space-separated, no commas) so Tailwind's
`rgb(var(--x-rgb) / <alpha-value>)` pattern keeps working for opacity variants.
Dark is the default (`:root`); light is `html.light`.

### Dark (default)

| Token                  | RGB                     | Hex       | Role                                       |
| ---------------------- | ----------------------- | --------- | ------------------------------------------ |
| `--bg-rgb`             | `0 0 0`                 | `#000000` | Page background, every route               |
| `--surface-rgb`        | `10 10 10`              | `#0A0A0A` | Bounded flat plane (card, panel)           |
| `--surface-raised-rgb` | `17 17 17`              | `#111111` | One step up (popover, modal, mockup panel) |
| `--surface-sunken-rgb` | `0 0 0`                 | `#000000` | Recessed (input well, player letterbox)    |
| `--ink-rgb`            | `255 255 255`           | `#FFFFFF` | Primary text, primary button fill          |
| `--ink-muted-rgb`      | `161 161 161`           | `#A1A1A1` | Secondary text, muted labels               |
| `--ink-faint-rgb`      | `102 102 102`           | `#666666` | Tertiary text, placeholder, disabled       |
| `--brand-rgb`          | `255 255 255`           | `#FFFFFF` | Primary action fill (white, not a hue)     |
| `--brand-hover-rgb`    | `161 161 161`           | `#A1A1A1` | Primary action hover                       |
| `--brand-text-rgb`     | `255 255 255`           | `#FFFFFF` | Text-on-transparent brand-emphasis         |
| `--onbrand-rgb`        | `0 0 0`                 | `#000000` | Text/icon on the white brand fill          |
| `--signal-rgb`         | `0 114 245`             | `#0072F5` | Focus rings, live/status dot **only**      |
| `--signal-soft-rgb`    | `0 114 245` (16% alpha) | —         | Signal glow halo                           |
| `--status-success-rgb` | `63 185 80`             | `#3FB950` | Semantic success only                      |
| `--status-warning-rgb` | `210 153 34`            | `#D29922` | Semantic warning only                      |
| `--status-danger-rgb`  | `255 85 85`             | `#FF5555` | Semantic danger only                       |
| `--line`               | `rgba(255,255,255,.14)` | —         | Hairline border, resting                   |
| `--line-strong`        | `rgba(255,255,255,.26)` | —         | Hairline border, emphasized/focused        |

### Light (`html.light`)

| Token                  | RGB                  | Hex       | Role                                                         |
| ---------------------- | -------------------- | --------- | ------------------------------------------------------------ |
| `--bg-rgb`             | `255 255 255`        | `#FFFFFF` | Page background                                              |
| `--surface-rgb`        | `250 250 250`        | `#FAFAFA` | Bounded flat plane                                           |
| `--surface-raised-rgb` | `244 244 244`        | `#F4F4F4` | One step up                                                  |
| `--surface-sunken-rgb` | `237 237 237`        | `#EDEDED` | Recessed                                                     |
| `--ink-rgb`            | `10 10 10`           | `#0A0A0A` | Primary text, primary button fill                            |
| `--ink-muted-rgb`      | `82 82 82`           | `#525252` | Secondary text                                               |
| `--ink-faint-rgb`      | `140 140 140`        | `#8C8C8C` | Tertiary/disabled                                            |
| `--brand-rgb`          | `10 10 10`           | `#0A0A0A` | Primary action fill (black, not a hue)                       |
| `--brand-hover-rgb`    | `64 64 64`           | `#404040` | Primary action hover                                         |
| `--brand-text-rgb`     | `10 10 10`           | `#0A0A0A` | Text-on-transparent brand-emphasis                           |
| `--onbrand-rgb`        | `255 255 255`        | `#FFFFFF` | Text/icon on the black brand fill                            |
| `--signal-rgb`         | `0 91 197`           | `#005BC5` | Focus rings, live/status dot only (darkened for AA on white) |
| `--status-success-rgb` | `27 127 58`          | `#1B7F3A` | Semantic success                                             |
| `--status-warning-rgb` | `122 91 0`           | `#7A5B00` | Semantic warning                                             |
| `--status-danger-rgb`  | `179 38 30`          | `#B3261E` | Semantic danger                                              |
| `--line`               | `rgba(10,10,10,.12)` | —         | Hairline, resting                                            |
| `--line-strong`        | `rgba(10,10,10,.22)` | —         | Hairline, emphasized/focused                                 |

**Rule of thumb (unchanged from DESIGN.md, narrowed by INV-4 v2.0):** exactly
one saturated color in normal use — `signal` blue, and only for focus rings and
live/status indicators. Everything else is black/white/gray. Color imagery (the
hero mockup's gradient mesh) is confined to its own contained panel and never
bleeds into page chrome.

## Typography

Reused from the discarded warm-cinema pass — self-hosted, already in
`app/styles/fonts.css` and `public/fonts/` (DECISION.md D-006).

- **Display** — `Bricolage Grotesque` (variable, 200–800), `Avenir Next`,
  `system-ui`, sans-serif fallback. Bold (700), tight tracking (-0.03 to
  -0.035em), used for headlines only.
- **Body** — `Karla` (variable, 200–800), `-apple-system`, `Segoe UI`, sans
  fallback. 400 for paragraphs, 600 for UI labels/buttons.
- **Mono/utility** — `ui-monospace, SFMono-Regular, Menlo, monospace` (system
  stack — no new font file). Used for badges, timestamps, room codes, status
  captions.

| Role         | Family              | Size                           | Weight  | Line-height | Tracking |
| ------------ | ------------------- | ------------------------------ | ------- | ----------- | -------- |
| display      | Bricolage Grotesque | `clamp(2.6rem, 5.2vw, 4.2rem)` | 700     | 1.02        | -0.035em |
| h2           | Bricolage Grotesque | 1.6rem                         | 700     | 1.2         | -0.02em  |
| h3           | Bricolage Grotesque | 1.15rem                        | 600     | 1.3         | -0.01em  |
| body         | Karla               | 1rem                           | 400     | 1.6         | normal   |
| bodySm       | Karla               | 0.875rem                       | 400     | 1.5         | normal   |
| caption/mono | ui-monospace        | 0.78rem                        | 400/500 | 1.4         | 0.02em   |

## Spacing

4px base unit (unchanged scale from the existing `tailwind.config.ts`):
`xxs 4 · xs 8 · sm 16 · md 24 · lg 32 · xl 40 · xxl 48 · xxxl 64 · display 80`.

## Radii

| Token  | Value | Use                                                      |
| ------ | ----- | -------------------------------------------------------- |
| `xxs`  | 4px   | tight inline chips                                       |
| `sm`   | 6px   | small controls                                           |
| `md`   | 10px  | inputs, small cards                                      |
| `lg`   | 16px  | cards, panels                                            |
| `full` | 999px | badges, pill buttons (new — primary interactive surface) |

## Elevation

No drop shadows for separation — hairline borders (`line`/`line-strong`) do that
job, unchanged from the prior system's flattening rule. Elevation above the flat
plane reads as a **glow**, not a shadow:

- `shadow-pop` — raised surface (modal, popover): soft black shadow only,
  `0 12px 40px -8px rgba(0,0,0,.55)` (kept, still correct on pure black).
- `shadow-glow` (new) — interactive hover/focus state:
  `0 0 0 1px var(--line-strong), 0 8px 24px -8px rgba(255,255,255,.35)`.
- `shadow-ring` — focus ring, now signal-blue:
  `0 0 0 2px rgb(var(--signal-rgb)), 0 0 0 4px rgb(var(--bg-rgb))`.

## Base components (delta from existing `app/shared/ui-kit/`)

Reuse and restyle the existing hand-built, already-accessible components — do
not replace them with shadcn's generated files wholesale. The project already
has tested, accessible primitives (`button.tsx`, `badge.tsx`, `modal.tsx`,
`popover.tsx`, `select.tsx`, `switch.tsx`, `text-field.tsx`); shadcn's
contribution here is the **visual grammar** (pill shape, monochrome fill,
glow-on-hover), applied to those existing components, plus Radix primitives only
where a genuine accessibility gap exists.

- **Button** — `primary`: white fill (`bg-brand`/`text-onbrand`), full pill
  radius, scale(1.02) + glow on hover. `secondary`: transparent, `line` border
  at rest, `line-strong` on hover. `ghost`: transparent, no border, `ink-muted`
  text. All three keep the existing 44px min-height and `focus-visible` ring,
  now signal-blue.
- **Badge** — pill radius, hairline border, `ink-muted` text; an optional
  leading solid chip (`bg-ink`/`text-onbrand`) for the "New" marker pattern.
- **Card/Panel** — flat `surface` fill, hairline border, `radius-lg`; hover
  state (where interactive) adds `shadow-glow`, never a lighter fill.
- **Input/TextField** — `surface-sunken` fill, `line` border at rest,
  `line-strong` at focus (existing affordance axis, kept).

## Motion tokens

| Token           | Value                                                                         |
| --------------- | ----------------------------------------------------------------------------- |
| `duration-fast` | 150ms                                                                         |
| `duration-base` | 200ms                                                                         |
| `duration-slow` | 280ms                                                                         |
| `ease-out`      | `cubic-bezier(0.16, 1, 0.3, 1)` (existing `fade-in`/`fade-up` easing, reused) |
| `hover-scale`   | 1.02–1.03                                                                     |
| `reveal`        | fade + translateY(10px)→0, light stagger (~80–100ms per item)                 |

**Forbidden:** bounce/elastic easing, skeuomorphic drop-shadows,
confetti/cartoon effects, decorative auto-looping motion outside a contained
mockup panel, glassmorphism (`.glass-panel`'s backdrop-filter is a pre-existing,
narrowly-scoped player-overlay exception — do not extend the pattern to new
surfaces).

## Implementation notes

- Token wiring stays in `app/tailwind.css` (`:root` / `html.light`) and
  `tailwind.config.ts`, following the existing
  `rgb(var(--x-rgb) /
  <alpha-value>)` convention — no new CSS-in-JS, no
  separate token file.
- `signal` is additive to the existing Tailwind color scale (`brand`,
  `status.*`, `line`), not a replacement for it — `brand` itself is repointed to
  white/black per the tables above.
- Applies app-wide: landing/marketing pages and in-room/player UI both draw from
  these same tokens. `PlayerShell`'s own overlay/stage mechanics (scrim,
  letterbox, fullscreen capsule) are unchanged in _behavior_; only their color
  values repoint to the tokens above.
