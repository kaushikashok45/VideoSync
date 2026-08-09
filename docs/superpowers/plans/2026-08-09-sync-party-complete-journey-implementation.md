# Sync Party Complete Journey Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved Native TV complete journey with one dominant action per screen, progressive disclosure, an 8pt rhythm, and centered playback controls.

**Architecture:** Preserve the existing feature-based React Router structure and stores. Refine the canonical entry-flow components and player-shell widgets in place; keep room, media, socket, and playback behavior in their current owners. Add pure logic only where a new state decision needs a testable owner.

**Tech Stack:** React 19, React Router v7, Tailwind CSS 3, Deno 2, Deno test runner, `@std/assert`, `lucide-react`.

## Global Constraints

- Follow `docs/superpowers/specs/2026-08-09-sync-party-complete-journey-design.md`.
- Use the existing Dark Cinema palette; do not add a second palette.
- Use Avenir-style sans for the wordmark, system sans for product UI, and monospace only for room codes/timestamps.
- Use the 8px grid; use 4px only for optical micro-alignment.
- Keep functions ≤20 lines where practical and preserve the feature/UI/logic separation.
- New behavior must have happy, sad, edge, mutation, and logical-limit coverage.
- Run `deno task verify` before completion and perform visual verification at desktop, tablet, and mobile widths.

## Task 1: Align design tokens and brand shell

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `app/styles/fonts.css`
- Modify: `app/widgets/brand-shell/ui/brand-mark.tsx`
- Modify: `app/features/entry-flow/components/entry-layout.tsx`
- Test: `app/widgets/brand-shell/ui/brand-mark.test.tsx` (create)

- [ ] Write a failing brand-mark test that asserts the approved wordmark label, Avenir/system font class, and no script font class.
- [ ] Run the focused test and confirm it fails because the old script brand is still rendered.
- [ ] Update Tailwind spacing/font tokens to the documented 8pt scale and system UI stacks; preserve existing semantic color names.
- [ ] Update `BrandMark` to render the Avenir-style `Sync Party` wordmark with the approved emphasis and accessible heading.
- [ ] Refine `EntryLayout` spacing and header hierarchy without changing route behavior.
- [ ] Run the focused brand-shell and entry-flow tests and confirm they pass.

## Task 2: Refine landing and inline join

**Files:**
- Modify: `app/features/entry-flow/components/landing-screen.tsx`
- Modify: `app/features/entry-flow/components/entry-layout.tsx`
- Modify: `app/features/room-join/ui/join-form.tsx`
- Test: `app/features/entry-flow/components/setup-screen.test.tsx`
- Test: `app/features/room-join/ui/room-code-copy.test.tsx`

- [ ] Add failing interaction coverage for the dominant `Start a party` path and the secondary inline join path, including preserved room-code input on validation failure.
- [ ] Run the tests and confirm the new assertions fail before changing the screen.
- [ ] Make the landing composition stage-led: one primary CTA, inline join disclosure, visible label/helper/error text, and no competing dashboard card grid.
- [ ] Keep socket creation, session updates, and navigation in the current owner; only change composition/copy and the join disclosure presentation.
- [ ] Run focused entry-flow and join tests.

## Task 3: Refine room identity, source setup, and readiness

**Files:**
- Modify: `app/features/entry-flow/components/setup-screen.tsx`
- Modify: `app/features/entry-flow/components/source-screen.tsx`
- Modify: `app/features/entry-flow/components/host-preplay-screen.tsx`
- Modify: `app/features/entry-flow/components/room-identity-card.tsx`
- Modify: `app/features/media-source/ui/source-picker.tsx`
- Modify: `app/features/media-source/ui/upload-dropzone.tsx`
- Modify: `app/features/media-source/ui/url-field.tsx`
- Test: existing `app/features/entry-flow/**.test.ts*` and `app/features/media-source/**.test.ts*`

- [ ] Add failing assertions for upload-first source selection, URL progressive disclosure, source errors beside the source control, and readiness copy naming who can start.
- [ ] Run focused tests and confirm the intended new assertions fail.
- [ ] Recompose setup/source/readiness into primary workspace + supporting context while preserving existing state logic and route transitions.
- [ ] Ensure selected filename, URL text, room code, and participant context survive errors and loading states.
- [ ] Ensure every primary/secondary action has visible disabled/loading/success/error treatment.
- [ ] Run focused entry-flow/media-source tests.

## Task 4: Implement centered player controls

**Files:**
- Modify: `app/widgets/player-shell/ui/player-shell.tsx`
- Modify: `app/widgets/player-shell/ui/player-header.tsx`
- Modify: `app/widgets/player-shell/ui/control-bar.tsx`
- Modify: `app/features/playback-control/ui/playback-controls.tsx`
- Modify: `app/widgets/player-shell/ui/utility-controls.tsx`
- Modify: `app/widgets/player-shell/ui/player-feedback.tsx`
- Modify: `app/widgets/room-sidebar/ui/room-sidebar.tsx`
- Test: `app/widgets/player-shell/ui/player-shell.test.tsx`
- Test: `app/widgets/player-shell/ui/player-feedback.test.tsx`
- Test: `app/widgets/player-shell/ui/utility-controls.test.tsx`
- Test: `app/widgets/room-sidebar/ui/room-sidebar.test.tsx`

- [ ] Add failing player assertions for the Avenir/system wordmark, room code + connection state, stable play/rewind/forward order, centered capsule, and menu-driven social tools.
- [ ] Run focused player tests and confirm they fail against the full-width bar/old header.
- [ ] Update the player header to expose the wordmark and room identity without duplicating connection status.
- [ ] Refactor the control bar into a bottom-center capsule with separated metadata/timeline safe zones; preserve keyboard and role gating.
- [ ] Reorder playback controls to play, rewind, forward without changing command semantics.
- [ ] Keep volume/fullscreen/share accessible through utility controls or room tools, with 44px targets and accessible names.
- [ ] Preserve fixed/top-layer room tools behavior so panels never clip inside the stage.
- [ ] Update feedback states so sync/readiness language is contextual and does not leave competing floating cards during normal playback.
- [ ] Run focused player and sidebar tests.

## Task 5: Visual verification and full regression

**Files:**
- Modify only files directly implicated by visual defects found during verification.

- [ ] Run `deno task build`.
- [ ] Run `deno task verify`.
- [ ] Inspect landing, join-expanded, setup, source, readiness, and player screens at desktop, tablet, and mobile widths.
- [ ] Verify keyboard-only playback/menu/reaction paths, Escape dismissal, focus return, reduced motion, 200% zoom, long room codes, long titles, empty members, loading, error, reconnect, and ended states.
- [ ] Run `git diff --check` and review the final diff for unrelated changes or duplicated UI logic.
