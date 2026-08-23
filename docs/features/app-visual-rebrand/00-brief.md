# 00-brief.md — App-wide visual rebrand, starting from the landing page

- **Slug**: app-visual-rebrand
- **Stage**: 0 (interrogation)
- **Verdict**: ENHANCE
- **Enhances**: landing, room identity, media setup, source selection, readiness, player — presentation layer only; no capability changes
- **Interrogated**: 2026-08-22

## Request as received

> I need a more proper landing page with a good attractive hero section and an
> immersive landing page with sections that sells the product properly with its
> benefits and features and uses hyperrealistic imagery and video where
> applicable. The layout must be innovative and eye catching experimenting with
> typography and a matching branded header and footer that rest of the pages
> will use. Do not rely on the existing DESIGN.md. Ask me more questions to
> extract information before you start the pipeline.

## Problem (validated)

- **Problem**: The current landing presentation and, by the requester's
  extension through this interrogation, the current app-wide visual system
  (`DESIGN.md`'s dark-cinema tokens) do not read as attractive or premium
  enough. There is no shared branded header/footer used consistently across
  screens.
- **Who experiences it**: First-time visitors deciding whether to start or join
  a watch party (`PRODUCT.md` — friends/family/small communities), and returning
  users on every screen once a shared header/footer exists.
- **Frequency / trigger**: Every landing visit; every screen view once the new
  chrome ships app-wide.
- **What happens today**: Landing (`app/features/entry-flow/components/landing-screen.tsx`)
  is a single scrolling screen with its own `landing-footer.tsx`; no header
  component is shared across routes. `app/common/components/Header.tsx` and
  `Footer.tsx` exist but are `DEAD` (no live importers) per `PRODUCT-MODEL.md`
  — they are not "existing chrome" in any working sense.
- **Cost of the friction**: Unclear first impression at the exact moment that
  determines whether a visitor starts or joins a room; inconsistent framing
  across screens because no shared header/footer exists to reuse.
- **Evidence for**:
  - **USER-STATEMENT / HIGH**: requester states the landing page is not
    "proper" or "attractive" and wants an immersive, benefit-selling layout
    with hyperrealistic media and experimental typography.
  - **PRODUCT-MODEL / HIGH**: `docs/PRODUCT-MODEL.md:293-297` — the only header
    /footer components in the codebase are `DEAD`; there is no live, reusable
    branded chrome today.
  - **CODE / HIGH**: `app/features/entry-flow/components/landing-screen.tsx`
    (126 lines) is a single-section screen with no dedicated hero, benefits, or
    feature-selling sections.
- **Evidence against**: **USER-STATEMENT / MEDIUM**: this is stakeholder visual
  preference, not measured evidence — `PRODUCT-MODEL.md` confirms this product
  has no analytics of any kind, so no conversion or bounce data exists or can
  be fabricated to support this. The success signal must be a falsifiable
  design/review outcome, not an invented metric.

## Existing-solution check

| Candidate from PRODUCT-MODEL.md | Overlap | Outcome |
|---|---|---|
| Landing (`LIVE`) | Total surface overlap | Enhance — do not create a parallel landing route |
| `app/common/components/Header.tsx` / `Footer.tsx` (`DEAD`) | Same concept (app chrome), zero working overlap | Not reusable as-is; build new — this is outstanding work, not duplication |
| `landing-footer.tsx` (feature-local, `LIVE` on landing only) | Partial overlap | Superseded by the new shared footer |
| Room identity / setup / source-selection / readiness / player screens (`LIVE`) | Full-app rebrand extends the new visual system and shared header/footer onto these | Enhance in place; **no change to their underlying capability, flow, or step count** |
| Synchronized playback (`CONTRACT-ONLY`), control delegation (`UNWIRED`) | None — presentation-only feature | Out of scope; not touched |

## Resolved assumptions

| # | Hidden assumption | Decision | Decided by |
|---|---|---|---|
| 1 | An unmerged Copilot checkpoint branch already contains a similar, wider "landing + journey redesign" pipeline run (`00-brief.md` → `02c-critique.md`, refs/copilot/checkpoints/6c87ee87...) and should inform this one | Ignore it entirely; this feature is scoped and interrogated fresh, independent of that unmerged work | Requester, 2026-08-22 |
| 2 | "Do not rely on DESIGN.md" means only the landing page gets a new visual language | It means an **app-wide rebrand**: the new visual system (typography, colour, layout) applies to landing, room identity, setup, source-selection, readiness, and the player — not just landing | Requester, 2026-08-22 |
| 3 | The new branded header/footer is landing-only chrome | It is shared chrome used on **every screen**, including the player | Requester, 2026-08-22 |
| 4 | Header/footer follow the player's existing idle-based auto-hide pattern like other playback controls | They are **always visible during windowed playback** and are hidden **only** when the player enters true (browser) fullscreen | Requester, 2026-08-22 |
| 5 | Hyperrealistic hero imagery/video can be represented with real in-app footage of synchronized playback | No such footage can exist honestly — sync is `CONTRACT-ONLY` (not wired). Source imagery/video from **licensed or stock footage**, bundled as static assets; no fabricated "product in action" shots implying working sync | Requester, 2026-08-22 |
| 6 | The rebrand also restructures the user journey (steps, flow order, IA) the way the abandoned Copilot brief attempted | Out of scope here — this is a **visual-system and chrome** rebrand only; `PRODUCT.md`'s "Approved journey direction" (5-step progressive disclosure) is unchanged. Flagged for requester confirmation at the gate below | Interrogation default — confirm at gate |
| 7 | `PRODUCT.md`'s Brand Personality section (warm, cinematic, social, trustworthy; "Sync Party" wordmark; red accent as *personality*, not fixed hex) is also open for replacement | Brand personality words and the product name/wordmark concept stay authoritative; only `DESIGN.md`'s concrete token/component execution is open for replacement. Flagged for requester confirmation at the gate below | Interrogation default — confirm at gate |
| 8 | Typographic "experimentation" means accessibility constraints (AA contrast, `prefers-reduced-motion`, keyboard operability) from `PRODUCT.md`'s Accessibility & Inclusion section are also up for revision | Those constraints are **not** open — they are product-level accessibility commitments, independent of which visual system implements them | Interrogation default — confirm at gate |

## Resolved contradictions

| # | Conflict | Resolution | Recorded as |
|---|---|---|---|
| 1 | The request says not to rely on `DESIGN.md`, but every other screen in the product is built on its token system, and the pipeline's design stages (1b–1e) are built to *extend* `DESIGN.md`, never replace it wholesale | Requester confirmed this is a deliberate, full app-wide rebrand: `DESIGN.md`'s current dark-cinema token system is superseded, not extended. `visual-designer` (stage 1e) will still route any new token set through the existing delta-confirmation gate before `DESIGN.md` is edited — that governance step is not waived, only its outcome (extend vs. replace) is now known upfront | Draft PD-021 |
| 2 | A persistent header/footer on the player screen directly contradicts `DESIGN.md` Principle #1 ("the video is the stage... chrome appears on demand and gets out of the way") and the `PlayerShell`'s existing idle-based auto-hide behaviour | Requester resolved this explicitly: header/footer are always visible during windowed playback and hidden only in true fullscreen. This is a genuine, confirmed change to the player's chrome behaviour, not an oversight | Draft PD-022 |

## Scope

| Requirement | MUST / SHOULD / NICE / OUT / UNKNOWN | Reason |
|---|---|---|
| Redesign the landing page: attractive hero, sections that sell benefits/features, hyperrealistic imagery/video | MUST | Core of the original request |
| New shared branded header component, used on every route | MUST | Confirmed app-wide scope |
| New shared branded footer component, used on every route | MUST | Confirmed app-wide scope |
| Header/footer always visible during windowed playback; hidden only in true (browser) fullscreen | MUST | Explicit resolution of the stage-principle conflict (PD-022) |
| New visual system (typography, colour, layout) applied to landing, room identity, setup, source-selection, readiness, and the player | MUST | Confirmed full-rebrand scope |
| Innovative/experimental typography treatment, within AA contrast and existing accessibility commitments | MUST | Requested; bounded by non-negotiable accessibility constraints |
| Hero/section imagery and video sourced as licensed or stock footage, bundled as static assets | MUST | Resolves the sourcing assumption; no server-side media storage exists to depend on (`PRODUCT-MODEL.md` product boundaries) |
| Preserve `PRODUCT.md` brand personality words and the "Sync Party" name/wordmark concept | MUST | Confirmed at the gate below; distinguishes "visual execution" from "brand identity" |
| Preserve all underlying capability wiring exactly as-is (room creation/join, playback mechanics, chat, reactions, P2P topology) | MUST | This is a presentation-layer feature; PD-001–009 are untouched |
| Restructure the user journey / step count / information architecture | OUT | Explicitly rejected — see resolved assumption #6; a separate future feature if wanted |
| Wire synchronized playback or control delegation | OUT | Still `CONTRACT-ONLY` / `UNWIRED`; unrelated to a visual rebuild and explicitly not requested |
| New accounts, persistence, analytics, billing | OUT | Closed dimensions per `PRODUCT-MODEL.md` |
| Exact new `DESIGN.md` token values, layout grid, motion timings | UNKNOWN | Stage 1e (`visual-designer`) and the design triad's job, not stage 0's |
| Specific stock/licensed asset sources, licensing cost, and bundle-size budget for hero media | UNKNOWN | Needs a concrete answer before `01-prd.md` can carry it as a constraint rather than an open question |

## Constraints carried in

- No server-side media storage or CDN exists (`PRODUCT-MODEL.md` product
  boundaries) — all imagery/video for the new landing/marketing sections must
  ship as static bundle assets; watch the bundle-size impact.
- Accessibility commitments in `PRODUCT.md` (AA contrast, `prefers-reduced-motion`,
  full keyboard operability, visible focus) apply to the new visual system
  exactly as they apply to the current one — non-negotiable, not part of what's
  "open" in this rebrand.
- `PD-001`–`PD-009` (P2P topology, ephemeral in-memory rooms, no accounts,
  host→viewer-only media, Zustand/Context split, audio-capture timing,
  `Reciever` misspelling frozen) are all unaffected; this feature touches
  presentation only.
- The player's chrome-visibility model changes from "idle auto-hide" to
  "always visible except in true fullscreen" **only for the new header/footer**;
  existing playback controls' auto-hide behaviour (`use-idle-visibility.ts`) is
  not otherwise specified as changed and should be confirmed with `design-lead`.
- `visual-designer`'s existing delta-confirmation gate (pipeline stage 14) still
  applies before `DESIGN.md` is actually edited — this brief establishes intent
  to replace, not a pre-approved final token set.

## Decisions to append to docs/DECISIONS.md

> Both drafted below; human-confirm before append, per this pipeline's rule
> that an agent never appends unilaterally.

### PD-021 — Full visual-system rebrand supersedes DESIGN.md's dark-cinema token system app-wide

- **Decided**: 2026-08-22 · `docs/features/app-visual-rebrand/00-brief.md`
- **Why**: stakeholder judgment that the current visual execution does not read
  as attractive/premium enough, starting from the landing page and extended to
  the whole app during this interrogation.
- **Alternatives rejected**: a landing-only marketing sub-system that leaves
  in-room screens on the current dark-cinema system — rejected by the
  requester in favour of one consistent app-wide language.
- **Consequences**: `DESIGN.md`'s current tokens are not a fixed constraint for
  this feature; `visual-designer` proposes a replacement token set through its
  normal delta-confirmation gate. `PRODUCT.md`'s brand-personality words and
  product name/wordmark concept remain authoritative — only concrete visual
  execution changes.

### PD-022 — Header/footer are always visible during windowed playback; hidden only in true fullscreen

- **Decided**: 2026-08-22 · `docs/features/app-visual-rebrand/00-brief.md`
- **Why**: the requester wants persistent branded chrome across every screen,
  including the player, while still preserving an unobstructed stage in true
  fullscreen viewing.
- **Alternatives rejected**: idle-based auto-hide matching existing playback
  controls (rejected — requester wants the chrome persistent, not
  interaction-gated); fully persistent even in fullscreen (rejected — the
  requester explicitly carved out fullscreen as chrome-free).
- **Consequences**: amends `DESIGN.md` Principle #1 ("the video is the stage")
  for the non-fullscreen case. `design-lead` must specify exactly how the
  header/footer coexist with the existing bottom-center playback capsule
  without competing for the same screen real estate.
