# Now Playing Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved Vercel/Geist now-playing redesign, stable control visibility, proper seek flow, and direct source-to-playing navigation.

**Architecture:** Keep `PlayerShell` and `PlaybackSync` mounted for the lifetime of the player. Make the control bar a transparent overlay whose visibility changes are CSS-only, and make the seeker own transient drag state before committing through the existing playback command model. Source selection continues to publish the canonical `hostSourceStore` handoff and navigates directly to the host player route.

**Tech Stack:** React 19, React Router v7, Tailwind CSS 3, lucide-react, Deno test runner, `@std/assert`.

## Global Constraints

- Use existing `MASTER.md` tokens and shared UI primitives; do not add dependencies.
- Rewind and forward use exactly 10 seconds and retain accessible labels.
- Player `ui/` components remain props-only and contain no store ownership.
- Run `deno task verify` before completion.

---

### Task 1: Lock the 10-second playback contract

**Files:**
- Modify: `app/entities/playback/seek-seconds.ts`
- Test: `app/entities/playback/playback-store.test.ts`
- Test: `app/features/playback-control/model/playback-behaviour.test.ts`

- [ ] Add failing assertions that the exported seek step is 10 and store forward/rewind clamp using that step.
- [ ] Run `deno test -A --sloppy-imports app/entities/playback/playback-store.test.ts app/features/playback-control/model/playback-behaviour.test.ts`; confirm failure if the current contract is 5 seconds.
- [ ] Update only the seek-step constant and related expected test values.
- [ ] Re-run the focused tests and confirm they pass.

### Task 2: Make seeker interaction stable while playing

**Files:**
- Modify: `app/widgets/player-shell/ui/seeker.tsx`
- Test: `app/widgets/player-shell/ui/seeker.test.tsx`
- Modify: `app/widgets/player-shell/ui/control-bar.tsx`

- [ ] Add a test harness that changes the range while playback is active and asserts the draft value is rendered during interaction and the committed target is emitted once on change/release.
- [ ] Run the seeker test file and confirm the new assertion fails before implementation.
- [ ] Add controlled draft state with pointer/keyboard activation and commit callbacks; clamp invalid duration/current values, and never call pause/play from the seeker.
- [ ] Pass the stable commit handler from `ControlBar` to the existing `applyPlayback("seek", ...)` command.
- [ ] Re-run the focused seeker and playback-control tests.

### Task 3: Redesign the player chrome without remounting playback

**Files:**
- Modify: `app/widgets/player-shell/ui/control-bar.tsx`
- Modify: `app/features/playback-control/ui/playback-controls.tsx`
- Modify: `app/widgets/player-shell/ui/player-header.tsx`
- Modify: `app/widgets/player-shell/ui/utility-controls.tsx`
- Modify: `app/widgets/player-shell/ui/player-shell.tsx`
- Test: `app/widgets/player-shell/ui/player-shell.test.tsx`
- Test: `app/widgets/player-shell/ui/host-route-handoff.test.tsx`

- [ ] Add a regression assertion that the video node and playback sync remain the same mounted elements when control visibility toggles.
- [ ] Run the focused player tests and confirm the regression test fails against conditional/remount-prone behavior.
- [ ] Keep `ControlBar`, `PlaybackSync`, and `video` mounted; use opacity/transform/pointer-events only for idle visibility.
- [ ] Center rewind/pause/forward controls, use lucide stroke icons with 10-second labels, keep volume/fullscreen right-aligned, and place timestamps adjacent to the seeker.
- [ ] Blend header/footer into the black stage, replace text actions with chat/settings icons, show a subtle member count and signal-blue `In sync` state, and remove the explanatory fade message.
- [ ] Keep reaction tray mounted and centered above the seeker when controls are visible; preserve keyboard/focus and reduced-motion behavior.
- [ ] Re-run focused player tests and inspect mobile/desktop output through the existing app preview.

### Task 4: Navigate from source selection directly to playing

**Files:**
- Modify: `app/features/entry-flow/components/host-preplay-screen.tsx`
- Modify: `app/routes/$id.HostVideoPlayerNew.tsx`
- Test: `app/widgets/player-shell/ui/host-route-handoff.test.tsx`
- Test: `app/features/media-source/model/source-behaviour.test.ts`

- [ ] Add a failing route test that a selected source reaches the live host player without rendering the preview-only action screen.
- [ ] Run the focused route tests and confirm the failure.
- [ ] Change the source-selection completion path to navigate directly to `HostVideoPlayerNew` while preserving the store handoff and metadata.
- [ ] Keep the explicit `?preview=1` branch available for tests or deliberate preview usage.
- [ ] Re-run route/source tests and confirm upload and URL sources both land on the live player.

### Task 5: Verify and review

**Files:**
- Modify: any implementation files above only if verification exposes an issue.

- [ ] Run `deno task verify`.
- [ ] Run a responsive visual check at mobile, tablet, and desktop widths; verify the control cluster, seeker, icons, chat/settings actions, reaction tray, and sync status.
- [ ] Review the final diff for unnecessary files, remounts, duplicated state, and accidental changes outside the requested flow.
