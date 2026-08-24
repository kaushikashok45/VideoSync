# Discord-inspired room player Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the joined room open as a Discord-like 3/4 player + 1/4 room sidebar, while allowing maximized playback with on-demand chat and settings drawers.

**Architecture:** Keep `PlayerShell` as the stable video/stage owner and reuse the existing playback, member, chat, reaction, and socket stores. Use the existing integrated `RoomSidebar` as the default right column and its non-integrated mode as the maximized drawer; add a settings presentation tab without duplicating domain state. Refine the existing player header/control bar classes to match the approved black/white Vercel-like mockup.

**Tech Stack:** React 19, Tailwind CSS 3, lucide-react, Deno tests, in-app browser.

## Global Constraints

- The video element must remain mounted while controls, chat, settings, or maximized state change.
- Rewind and forward remain exactly 10 seconds and retain accessible labels.
- New UI must use props-only presentation where the existing boundary requires it; state stays in `PlayerShell` or existing stores.
- The room sidebar must remain keyboard accessible, Escape-dismissible, and reduced-motion safe.
- No new dependencies, routes, legacy-zone files, or duplicate room state.
- Verify with `deno task verify` before claiming completion.

---

### Task 1: Default room layout state

**Files:**
- Modify: `app/widgets/player-shell/ui/player-shell.tsx`
- Modify: `app/tailwind.css`
- Test: `app/widgets/player-shell/ui/player-shell.test.tsx`

**Interfaces:**
- `PlayerShell` continues to expose `data-testid="player-shell"`, `data-testid="player-video"`, and `data-testid="control-bar"`.
- `isMinimized=true` means the default room layout with an integrated right sidebar; `isMinimized=false` means maximized player.

- [ ] **Step 1: Write the failing tests**

Add assertions that a freshly rendered shell has `is-minimized`, an open integrated room sidebar, and a visible chat stream; add a mutation assertion that the maximize control changes to `Restore full player` and closes the integrated sidebar.

- [ ] **Step 2: Run the focused test**

Run: `deno test -A --sloppy-imports app/widgets/player-shell/ui/player-shell.test.tsx`

Expected: the new default-layout assertions fail against the current full-screen default.

- [ ] **Step 3: Implement the state/layout change**

Initialize `isMinimized` to `true` and `roomOpen` to `true`. Keep the existing callback that toggles the two states together, but update its labels/classes so `isMinimized` is the room state and the inverse is maximized. Change the desktop stage rule in `app/tailwind.css` to reserve a responsive sidebar width:

```css
@media (min-width: 768px) {
  .player-stage.is-cinema.is-minimized {
    left: 0;
    right: clamp(320px, 25vw, 420px);
    width: auto;
    border-right: 0;
    border-radius: 0;
  }
}
```

- [ ] **Step 4: Run the focused test**

Run: `deno test -A --sloppy-imports app/widgets/player-shell/ui/player-shell.test.tsx`

Expected: the room-layout assertions pass; unrelated control-composition assertions may need their expected initial label updated in Task 2.

- [ ] **Step 5: Commit**

```bash
git add app/widgets/player-shell/ui/player-shell.tsx app/tailwind.css app/widgets/player-shell/ui/player-shell.test.tsx
git commit -m "Feat: Opens rooms in integrated player layout"
```

### Task 2: Player header and control composition

**Files:**
- Modify: `app/widgets/player-shell/ui/player-header.tsx`
- Modify: `app/widgets/player-shell/ui/control-bar.tsx`
- Modify: `app/widgets/player-shell/ui/utility-controls.tsx`
- Modify: `app/widgets/player-shell/ui/player-shell.test.tsx`
- Test: `app/widgets/player-shell/ui/utility-controls.test.tsx`

**Interfaces:**
- `PlayerHeader` keeps `onOpenRoom(tab)` and exposes one named chat control and one named settings control.
- `ControlBar` continues to consume the existing `PlaybackStore`, `PlaybackSnapshot`, seeker callbacks, and `PlaybackSyncHandle`.
- `UtilityControls` continues to own volume state synchronization and the maximize/restore action; its right cluster is below the seeker.

- [ ] **Step 1: Write the failing tests**

Pin the visible action names and order: `Rewind 10 seconds`, `Play`/`Pause`, `Forward 10 seconds`; assert the header has exactly one settings button and one chat button; assert the utility cluster contains `Volume` and the maximize/restore control.

- [ ] **Step 2: Run the focused tests**

Run: `deno test -A --sloppy-imports app/widgets/player-shell/ui/player-shell.test.tsx app/widgets/player-shell/ui/utility-controls.test.tsx`

Expected: the settings count/default-state expectations fail before the implementation changes.

- [ ] **Step 3: Implement the Vercel-like control hierarchy**

Use existing `PlaybackControls` so the rotate-arrow plus `10` overlay remains canonical. Keep the seeker in its own full-width row, the playback cluster centered in a second row, and the utility cluster absolutely aligned to the right of that second row. Use black surfaces, hairline borders, white active controls, and minimal rounded corners in the Tailwind classes. Keep fullscreen semantics on the existing maximize/restore control and remove any duplicate settings entry from lower chrome.

- [ ] **Step 4: Run the focused tests**

Run: `deno test -A --sloppy-imports app/widgets/player-shell/ui/player-shell.test.tsx app/widgets/player-shell/ui/utility-controls.test.tsx`

Expected: all focused player/control tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/widgets/player-shell/ui/player-header.tsx app/widgets/player-shell/ui/control-bar.tsx app/widgets/player-shell/ui/utility-controls.tsx app/widgets/player-shell/ui/player-shell.test.tsx app/widgets/player-shell/ui/utility-controls.test.tsx
git commit -m "Feat: Refines player control hierarchy"
```

### Task 3: Sidebar settings state and responsive sizing

**Files:**
- Modify: `app/widgets/room-sidebar/ui/room-sidebar.tsx`
- Modify: `app/widgets/room-sidebar/ui/room-sidebar.test.tsx`

**Interfaces:**
- `RoomSidebar` preserves `openTab?: "chat" | "members"` for callers and maps the existing members/host-tools content into the room settings view when integrated.
- The integrated desktop panel width is `clamp(320px, 25vw, 420px)`; non-integrated drawer behavior remains unchanged.

- [ ] **Step 1: Write the failing tests**

Add an integrated-sidebar test that opens with chat visible, switches to the settings button, shows room settings/member controls, and closes with Escape. Keep the existing non-integrated members-tab tests unchanged.

- [ ] **Step 2: Run the focused tests**

Run: `deno test -A --sloppy-imports app/widgets/room-sidebar/ui/room-sidebar.test.tsx`

Expected: the new settings-button and integrated content assertions fail because the current integrated header only exposes chat/members and the panel uses a fixed 380px width.

- [ ] **Step 3: Implement settings presentation**

In integrated mode, expose `Open chat` and `Open room settings` controls. Use a local `tab` union that includes `settings` only for the integrated branch; keep the non-integrated public members tab for existing callers. Render the existing `MemberList` and host tools beneath a concise “Room settings” heading so no new domain settings store is introduced. Use the responsive width class for the integrated aside and preserve focus/Escape behavior.

- [ ] **Step 4: Run the focused tests**

Run: `deno test -A --sloppy-imports app/widgets/room-sidebar/ui/room-sidebar.test.tsx`

Expected: all sidebar tests pass.

- [ ] **Step 5: Commit**

```bash
git add app/widgets/room-sidebar/ui/room-sidebar.tsx app/widgets/room-sidebar/ui/room-sidebar.test.tsx
git commit -m "Feat: Adds room settings panel state"
```

### Task 4: Full verification and browser QA

**Files:**
- Modify: any files required by fresh verification only.

- [ ] **Step 1: Run repository verification**

Run: `deno task verify`

Expected: formatting, lint, typecheck, and the full Deno test suite exit successfully.

- [ ] **Step 2: Inspect the integrated player in the in-app browser**

Run the dev server, navigate to a usable player route or existing room flow, and verify at desktop, tablet, and mobile widths:

1. Default join state shows player + right chat sidebar.
2. Chat and settings are the only top-right room utilities; no duplicate settings icon appears in lower chrome.
3. Seeker is above centered playback controls; volume and maximize/fullscreen are right-aligned below it.
4. Maximize removes the sidebar; chat/settings open only after their icons are clicked.
5. Escape closes drawers; visible focus rings remain; reduced motion removes slide transitions.

- [ ] **Step 3: Review diff and status**

Run: `git status --short && git diff --check && git log -6 --oneline`

Expected: only intended player/sidebar files remain changed, with no generated build output or secrets.

