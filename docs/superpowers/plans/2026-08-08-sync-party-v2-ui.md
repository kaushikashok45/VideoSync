# Sync Party v2 — Phase 2 UI/UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the entire frontend of The Sync Party as a rich, distraction-free, Netflix/Apple TV-grade viewing experience — following Apple Human Interface Guidelines across every surface — on the new FSD frontend structure and Zustand state layer.

**Architecture:** Feature-Sliced Design under `app/` (`app ← pages ← widgets ← features ← entities ← shared`). A Zustand store owns all realtime state (room, members, playback, chat, reactions) fed by the typed socket client + client sync engine built in Phase 1. The design system in `DESIGN.md` (dark cinema, OKLCH, red accent, script×mono) is the single source of visual truth. The movie-metadata feature (approved PRD extension) auto-fetches rich title/poster/cast/rating data for joiners.

**Tech Stack:** React 19, React Router v7 (framework mode), Zustand, Tailwind CSS 3 (tokens already wired), `socket.io-client` + Phase 1 `app/shared/api/*`, Deno test runner. Phase 2 adds `zustand` + a metadata lookup (TMDB-style free API).

**Primary design sources (authoritative, do not reinvent):**
- `DESIGN.md` — color, type, spacing, motion, components (the full system).
- `PRODUCT.md` — register (product), users, brand personality, principles.
- PRD §2 feature list F1–F30 (this plan maps every UI feature to a task).
- PRD §3.4.5 error surfaces (inline / banner / toast / screen) + §4 guardrails.
- `docs/CODING_STANDARDS.md` (≤20-line bodies, ≤150-line files, ≤4 params, file segregation).

---

## Global Constraints

- **Apple HIG applies to the ENTIRE frontend**, not just errors: clarity, deference (the video is the stage; chrome recedes), depth (layered scrims/backdrops used meaningfully), implicit feedback, and a single primary action per surface.
- **Netflix/Apple TV-grade richness is the bar**, not a nice-to-have: entrance motion with `prefers-reduced-motion` fallbacks, backdrop blur + color-extracted poster gradients, hover micro-interactions, animated reaction overlays, polished empty/loading/error states.
- **TDD + reviewer gate** — same discipline as Phase 1: failing test first, per-task reviewer, `deno task verify` green before any task is accepted.
- **File segregation** — one entity/type/function per file; a slice holds its own `ui/`, `model/`, `api/`, `lib/`.
- **FSD layer rules** — deps point inward; no cross-feature imports; no business logic in components.
- **Tell, Don't Ask** — Zustand actions are commands; components call them, never inspect-and-decide.
- **No `any`**; typed contracts everywhere. Event names from `SOCKET_EVENTS`.
- **Accessibility** — WCAG AA contrast (already validated in DESIGN.md), full keyboard operability, `prefers-reduced-motion`, `prefers-color-scheme` respected, semantic HTML + ARIA live regions for toasts/banners.
- **The old `app/` UI code is reference-only.** Do not reuse its components or structure. This is a clean-slate build on the Phase 1 contracts and `app/shared/api`.
- Deno-native: `deno add npm:zustand` for the store; no package.json.

---

## Task 1: Zustand store — `entities`-level realtime state

**Files:**
- Create: `app/entities/room/room-store.ts` — `interface RoomState` + `createRoomStore(deps): RoomStore` (one module).
- Create: `app/entities/member/members-store.ts` — member list + permissions slice.
- Create: `app/entities/playback/playback-store.ts` — client playback state slice.
- Create: `app/entities/chat/chat-store.ts` — chat messages slice.
- Create: `app/entities/reaction/reaction-store.ts` — active reactions slice.
- Test: `app/entities/playback/playback-store.test.ts`, `app/entities/member/members-store.test.ts` (pure reducers, no sockets).

**Interfaces:**
- `createRoomStore(deps: { socketClient }): RoomStore` with actions: `createRoom(name)`, `joinRoom(code, name)`, `leaveRoom()`, `onRoomEnded(cb)`.
- `MembersStore` with `members: Member[]`, `me: Member`, actions `grantControl(id)`, `revokeControl(id)`, `toggleEveryoneControl()`, `approveRequest(id)`, `denyRequest(id)`.
- `PlaybackStore` built on Phase 1 `createSyncEngineClient`: `snapshot`, `projected`, `play()`, `pause()`, `seek(t)`, `forward()`, `rewind()`, `applyServerSnapshot(s)`.
- `ChatStore`: `messages: ChatMessage[]`, `send(text)`, `append(m)`.
- `ReactionStore`: `active: Reaction[]`, `send(emoji)`, `burst(reaction)`.

- [ ] **Step 1: `deno add npm:zustand`** — install and confirm it resolves.

- [ ] **Step 2: Write failing tests (all five categories) for the pure slices**

`app/entities/playback/playback-store.test.ts` (uses `createSyncEngineClient` semantics — mirror server `PlaybackState`):
```ts
import { assertEquals } from "@std/assert";
import { createPlaybackStore } from "./playback-store.ts";

Deno.test("play() transitions to playing and returns a projected snapshot", () => {
  const store = createPlaybackStore({ driftThresholdMs: 1500 });
  store.applyServerSnapshot({ status: "paused", currentTime: 0, duration: 120, rate: 1, updatedAt: 100_000 });
  const snap = store.play();
  assertEquals(snap.status, "playing");
});

// Sad path: play() no-ops when ended
// Edge: no snapshot yet -> projected() is undefined
// Mutation: applyServerSnapshot replaces wholesale (does not merge)
// Limits: seek clamps to [0, duration]; drift threshold exactly-at is in-sync, beyond is not
```

`app/entities/member/members-store.test.ts`:
```ts
// Happy: joinRoom appends a member; grantControl flips canControl
// Sad: revokeControl as non-host rejected via typed error
// Edge: re-adding same member id is idempotent
// Mutation: approveRequest moves request from queue to controlled set only once
// Limits: every-member toggle flips exactly all viewers
```

- [ ] **Step 3: Run tests — expect FAIL (modules missing).**

- [ ] **Step 4: Implement the four pure stores** following the server entity shapes (`Member`, `PlaybackSnapshot`, `ChatMessage`, `Reaction` from `contracts/`). Each store is a small Zustand `create` with typed actions; no JSX; no socket wiring yet (deps injected).

- [ ] **Step 5: Run tests — expect PASS. Run `deno task verify`.**

- [ ] **Step 6: Commit** — `Feat: adds Zustand realtime state stores (room/members/playback/chat/reaction)`.

---

## Task 2: FSD restructure of `app/` + typed socket wiring

**Files:**
- Create: `app/app/providers.tsx` — composes SessionContext + ThemeProvider + the new stores' providers.
- Create: `app/app/theme-provider.tsx` — dark-first theme with `prefers-color-scheme` + manual toggle (persisted to localStorage).
- Create: `app/shared/api/socket-bridge.ts` — wires the Phase 1 `createSocketClient` into the Zustand stores (subscribe → dispatch).
- Create: `app/widgets/` dirs for `player-shell`, `room-sidebar`, `member-list`, `reaction-overlay` (empty shells; built out in Tasks 5–8).
- Create: `app/pages/` route wrappers (thin; delegate to widgets/features).
- Create: `app/routes.ts` — route map to new `app/pages/*` components (React Router flat routes stay).
- Modify: `app/root.tsx` — replace old Header/Footer/Session wiring with `Providers` + the design-system shell (bg, fonts, focus, Toaster styled to theme).

**Interfaces:**
- `Providers` wraps the tree; `useTheme()` returns `{ theme, toggle }`.
- `SocketBridge` receives the `SocketClient` (from `createSocketClient({ url })`) once and subscribes `MEMBER_JOINED/MEMBER_LEFT/CHAT_MESSAGE/REACTION/SIGNAL/ROOM_ENDED/APP_ERROR` into the stores; exposes the client via context.

- [ ] **Step 1: Write failing tests** for `socket-bridge` — given a fake `SocketClient` (typed to the Phase 1 interface) that emits `MEMBER_JOINED`, assert the members store updates. Five categories: happy (event → store), sad (APP_ERROR → error surface signal), edge (event for unknown room ignored), mutation (duplicate MEMBER_JOINED idempotent), limits (message flood capped at N).

- [ ] **Step 2: Run tests — expect FAIL.**

- [ ] **Step 3: Implement** `socket-bridge.ts`, `providers.tsx`, `theme-provider.tsx` per the interfaces. Keep each file <150 lines; split the bridge's event handlers if needed.

- [ ] **Step 4: Run tests — PASS. Run `deno task verify`.**

- [ ] **Step 5: Commit** — `Feat: restructures app into FSD layers with Zustand + theme providers and typed socket bridge`.

---

## Task 3: Design-system component kit — `shared/ui-kit`

**Files:** (one component per file, all under `app/shared/ui-kit/`)
- Create: `button.tsx` (primary brand / secondary surface, sizes, loading, disabled), `button.test.tsx`-adjacent unit via render test.
- Create: `text-field.tsx` (label, helper, error state, focus ring per DESIGN.md), `select.tsx`.
- Create: `popover.tsx` (native `<dialog>`/popover API so it escapes overflow), `modal.tsx` (dialog + backdrop + focus trap + Esc + aria-modal).
- Create: `avatar.tsx` (initials, brand-tinted), `badge.tsx`, `toast.tsx` (styled sonner wrapper), `spinner.tsx`, `empty-state.tsx` (script voice).
- Create: `reaction-button.tsx`, `icon-button.tsx`, `switch.tsx` (for host toggles).
- Create: `index.ts` — barrel re-export only (no implementation in the barrel).

**Interfaces:**
- Every control takes `className` and spreads native props; follows DESIGN.md radii/padding/spacing tokens; `prefers-reduced-motion` collapse built in; keyboard focus ring = `brand` 2px.
- `Popover`/`Modal` use the native dialog API — never `position: absolute` in an overflowed ancestor.

- [ ] **Step 1: Write failing render tests** for `button`, `modal`, `popover`, `switch`, `text-field` using a light DOM harness (the Phase 1 `@std/assert` + jsdom-style). Assert: correct ARIA attributes (`aria-modal`, `aria-expanded`, role), focus management (modal traps focus, Esc closes), disabled state, reduced-motion class present.

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Implement** each component per DESIGN.md tokens and Apple HIG (deference, clarity, single primary action). Use `@headlessui`-free hand-rolled dialog logic to keep deps minimal, or `radix` if already present — check first.

- [ ] **Step 4: Run tests — PASS. `deno task verify`.**

- [ ] **Step 5: Commit** — `Feat: adds DESIGN.md-conformant ui-kit components`.

---

## Task 4: Movie metadata feature — data model + lookup + contracts (PRD extension)

**Files:**
- Create: `shared/contracts/movie-metadata.ts` — `interface MovieMetadata { title; overview; posterUrl; backdropUrl; releaseYear; ageRating; runtime; genres: string[]; cast: string[] }` (one entity file).
- Create: `shared/contracts/payloads/movie-metadata-payload.ts` — `interface MovieMetadataPayload { metadata: MovieMetadata }`.
- Create: `server/features/metadata/metadata-handler.ts` — server proxy that calls a free metadata API (TMDB-style) given a title/URL, returns normalized `MovieMetadata`, rate-limited, cached in-memory.
- Create: `server/features/metadata/metadata-handler.test.ts` — five categories with a mocked fetch (happy: returns normalized metadata; sad: API down → typed `MEDIA_URL_UNPLAYABLE`-family error; edge: no match → graceful `metadata: null`; mutation: field mapping stable; limits: cache hit avoids second fetch, rate limit enforced).
- Create: `app/shared/api/metadata-client.ts` — typed client wrapper for `metadata.fetch`.
- Modify: `shared/contracts/socket-events.ts` + Phase 1 room payloads to carry `metadata?: MovieMetadata` on room create/join.

**Interfaces:**
- `fetchMetadata(query: { title: string; type: "movie" } | { url: string }): Promise<MovieMetadata | null>` — server endpoint `/api/metadata` (HTTP route, not socket).
- Room `RoomMeta` gains `metadata?: MovieMetadata`; joiners receive it in `ROOM_JOINED`.

- [ ] **Step 1: Write failing tests** for the metadata handler (mocked fetch). Five categories as above.

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Implement** the handler + normalized mapper + cache + rate limit. Respect CODING_STANDARDS sizes (split mapper/cache).

- [ ] **Step 4: Run tests — PASS. `deno task verify`.**

- [ ] **Step 5: Commit** — `Feat: adds movie metadata model, lookup endpoint, and room metadata contract (PRD extension)`.

---

## Task 5: Home page — the landing stage

**Files:**
- Create: `app/pages/home/home-page.tsx` — the route component.
- Create: `app/features/room-join/ui/join-form.tsx` — name + room-code entry (uses ui-kit TextField/Button).
- Create: `app/features/room-join/model/join-behaviour.ts` — `useJoinBehaviour()` hook (validate name, navigate to `/{roomId}/SetupScreen`).
- Create: `app/features/room-join/join-form.test.ts` — pure behaviour tests (name validation happy/sad/edge/mutation/limits).
- Create: `app/widgets/brand-shell/ui/brand-mark.tsx`, `app/widgets/brand-shell/ui/background-ambience.tsx` — the script brand mark + a subtle animated backdrop.

**Interfaces:**
- `HomePage` renders: centered brand mark (Yesteryear, `display` size), one primary action ("Join a watch party"), and a secondary "Start watching" that routes to room creation. Pure Apple-HIG deference: one decision per screen, generous rhythm, no clutter.

**Design cues (Netflix/Apple TV):**
- Backdrop: a very low-chroma animated radial glow behind the mark (opacity 0.15, slow drift), `prefers-reduced-motion` → static.
- Entrance: brand mark fades up (ease-out-expo 450ms), then the action. No gating of visibility on animation.

- [ ] **Step 1: Write failing tests** for `useJoinBehaviour` (validation + navigation intent). Five categories.

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Implement** HomePage + join-form + brand-shell. Keep the page under 150 lines (delegate to components).

- [ ] **Step 4: Browser-verify** with the headless browser: load `http://localhost:5173/`, screenshot, confirm the mark + single primary action render, check contrast, check no console errors.

- [ ] **Step 5: Run tests — PASS. `deno task verify`.**

- [ ] **Step 6: Commit** — `Feat: crafts the Home landing stage with brand mark and single primary action`.

---

## Task 6: Setup screen — rich "Now showing" join experience

**Files:**
- Create: `app/pages/setup/setup-page.tsx`.
- Create: `app/widgets/movie-now-showing/ui/now-showing-card.tsx` — the theater-poster card: backdrop image (color-extracted gradient + `backdrop-url`), poster, title, age rating badge, runtime, genres, cast chips, description (clamped), and the primary **Join** action.
- Create: `app/widgets/movie-now-showing/ui/now-showing-card.test.tsx` — render test (metadata present → all fields; metadata null → elegant empty state).
- Create: `app/features/room-join/ui/join-party-button.tsx` (uses ui-kit Button, navigates host→upload / viewer→player).
- Create: `app/features/room-join/model/join-behaviour.ts` extension for the two-path (host vs join) decision.

**Interfaces:**
- `SetupPage` reads `roomId` from the route + `SessionContext` role. Host → "Host the party" (→ `/file-upload`); viewer → the Now Showing card with metadata from the joined room + **Join** button (→ `/ReceiverVideoPlayerNew`).
- `NowShowingCard` accepts `metadata?: MovieMetadata` and `onJoin`.

**Design cues (Netflix/Apple TV):**
- Backdrop: full-bleed blurred poster backdrop (`backdrop-blur` + gradient scrim to `bg`), poster card on top at ~2:3, title in `h1` weight, rating in a bordered pill, cast as avatar chips, description `line-clamp-3`. Entrance staggered: backdrop → poster → title → action.
- If metadata is null: warm script empty state ("This watch party has no poster yet") + still show Join.

- [ ] **Step 1: Write failing tests** for `NowShowingCard` render (metadata happy + null empty-state) and the two-path join behaviour. Five categories.

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Implement** per the design cues. Keep files <150 lines; split poster/backdrop/cast into subcomponents if needed.

- [ ] **Step 4: Browser-verify** — screenshot the setup page with seeded metadata (inject a fixture in dev), confirm layout, contrast, no overflow at 375px.

- [ ] **Step 5: Run tests — PASS. `deno task verify`.**

- [ ] **Step 6: Commit** — `Feat: crafts the Now Showing setup screen with rich movie metadata`.

---

## Task 7: Upload / URL source picker (host)

**Files:**
- Create: `app/pages/upload/upload-page.tsx`.
- Create: `app/features/media-source/ui/source-picker.tsx` — a two-card choice (Upload file / Paste URL) per DESIGN.md (cards only where genuinely the best affordance), or a segmented control.
- Create: `app/features/media-source/ui/upload-dropzone.tsx` — drag-drop + click, progress, error states.
- Create: `app/features/media-source/ui/url-field.tsx` — URL input with validation + "lookup metadata" affordance.
- Create: `app/features/media-source/model/source-behaviour.ts` — `useSourceBehaviour()`: pick source → upload/URL → metadata lookup (Task 4) → navigate host → `/{roomId}/HostVideoPlayerNew`.
- Create: `app/features/media-source/model/source-behaviour.test.ts` — five categories (valid/invalid URL, no file, metadata lookup failure recoverable, etc.).

**Interfaces:**
- `SourceBehaviour` returns `{ source, setUpload, setUrl, submit, error, pending }`. On submit: if URL mode, calls `fetchMetadata({ url })` (recoverable error → inline message + Retry), then routes to the host player with `{ mode, url | stream, metadata }`.

**Design cues (Apple HIG):**
- Deference: clear, single primary action per step; helper text explains the choice; drag-drop zone has a visible affordance and keyboard-accessible file input; URL field validates inline (recoverable, `VALIDATION_URL_UNSUPPORTED` banner).

- [ ] **Step 1: Write failing tests** for `source-behaviour`. Five categories.

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Implement** source picker + dropzone + URL field + behaviour. Keep files sized.

- [ ] **Step 4: Browser-verify** — upload a sample file via the dropzone, confirm navigation + no console errors.

- [ ] **Step 5: Run tests — PASS. `deno task verify`.**

- [ ] **Step 6: Commit** — `Feat: crafts the host media-source picker (upload/URL) with metadata lookup`.

---

## Task 8: Player shell — the stage (host + receiver share the shell)

**Files:**
- Create: `app/widgets/player-shell/ui/player-shell.tsx` — the shared stage: video element, scrims, auto-hiding control bar, sidebar drawer, reaction overlay, Now Watching strip.
- Create: `app/widgets/player-shell/ui/player-shell.test.tsx` — render test (controls hidden until interaction; aria-hidden on idle chrome).
- Create: `app/widgets/player-shell/ui/control-bar.tsx` — bottom bar: play/pause, forward/rewind (±10s), progress seeker (brand playhead), volume, fullscreen, share; auto-hides after ~3s idle; appears on pointer/keyboard movement.
- Create: `app/widgets/player-shell/ui/playback-sync.tsx` — wires `PlaybackStore` to the `<video>` element: applies snapshot, drift correction, `timeupdate`/`loadedmetadata` events.
- Create: `app/features/playback-control/ui/playback-controls.tsx` — permission-aware buttons (host/conductor only vs private controls per F13–F18).
- Create: `app/features/playback-control/model/playback-behaviour.ts` + test — determines `canControlRoom`, applies actions, emits sync.

**Interfaces:**
- `PlayerShell` props: `{ mode: "host" | "receiver"; media: { url } | { stream }; metadata? }`. It renders `<video>` via `playback-sync`, the `control-bar`, `room-sidebar` (Task 9), `reaction-overlay` (Task 10), and a `Now Watching` strip.
- `playback-sync` is the single place that touches the video element (Tell-Don't-Ask: it applies store snapshots and reports `timeupdate`).

**Design cues (Netflix/Apple TV):**
- **The video is the stage**: chrome fades behind scrims on interaction and recedes on idle. Scrim gradient only over the video, never a full-page tint.
- Controls: 2px brand playhead on a `borderStrong` track; 56px icon targets (thumb-friendly); hover lifts; click gives instant feedback. Forward/rewind show a small "+10s/−10s" label that fades.
- Idle auto-hide with `prefers-reduced-motion` → instant hide.
- Buffering/loading: a subtle pulsing spinner (brand), not a blank frame.
- All chrome keyboard-operable; focus ring visible; controls `aria-hidden` when hidden.

- [ ] **Step 1: Write failing tests** for `playback-behaviour` (permission matrix) and a `player-shell` render test. Five categories.

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Implement** the shell + control bar + sync wiring. Respect size limits (split shell into subcomponents).

- [ ] **Step 4: Browser-verify** — load the host player with a sample file, confirm controls auto-hide, seeker works, no console errors, screenshot desktop + 375px.

- [ ] **Step 5: Run tests — PASS. `deno task verify`.**

- [ ] **Step 6: Commit** — `Feat: crafts the shared PlayerShell stage with auto-hiding controls and sync wiring`.

---

## Task 9: Room sidebar (chat + members) + host tools

**Files:**
- Create: `app/widgets/room-sidebar/ui/room-sidebar.tsx` — collapsible right panel; tabs or stacked sections: Chat | Members; mobile → bottom sheet.
- Create: `app/features/chat/ui/chat-box.tsx`, `app/features/chat/ui/message-stream.tsx`, `app/features/chat/model/chat-behaviour.ts` + test (send happy/sad rate-limit/edge empty/mutation order/limits scroll-back).
- Create: `app/widgets/member-list/ui/member-list.tsx` — each member: avatar, name, host badge, control indicator.
- Create: `app/features/room-controls/ui/host-tools.tsx` — host panel: lock room, everyone-collaborate toggle, member control toggles (F15), request queue approve/deny (F17), room code copy, end party.
- Create: `app/features/room-controls/model/host-tools-behaviour.ts` + test (grant/revoke/everyone/lock happy/sad/edge/mutation/limits).

**Interfaces:**
- `RoomSidebar` open/close state in the store; animates in/out (transform only); `aria-expanded` + focus management.
- `HostTools` reads `me.role === "host"` and permission state from `MembersStore`; every action is a store command.

**Design cues:**
- Sidebar on `surfaceRaised`, 1px `line` divider, slides in over a scrim; on mobile it's a bottom sheet (drag to dismiss, backdrop tap to close).
- Chat messages: sender name in `inkMuted`, body in `ink`, timestamp `inkFaint`; the composer sticks to bottom with focus ring; system messages (presence) styled as centered muted pills.
- Reactions: a reaction row of the 5 emojis; each sends a `reaction-float` overlay (Task 10).
- Host controls use `Switch` components with clear labels; destructive actions (end party) confirm via `Modal`.

- [ ] **Step 1: Write failing tests** for chat-behaviour + host-tools-behaviour. Five categories each.

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Implement** the sidebar, chat, member list, and host tools. Size-split as needed.

- [ ] **Step 4: Browser-verify** — two tabs, host + viewer, join a room; send chat, toggle controls, screenshot desktop + mobile bottom sheet.

- [ ] **Step 5: Run tests — PASS. `deno task verify`.**

- [ ] **Step 6: Commit** — `Feat: crafts the room sidebar with chat, member list, and host tools`.

---

## Task 10: Reactions overlay + presence

**Files:**
- Create: `app/widgets/reaction-overlay/ui/reaction-overlay.tsx` — full-surface overlay that floats reactions over the video (F22/F23).
- Create: `app/widgets/reaction-overlay/ui/reaction-float.tsx` — a single floating emoji (uses `reaction-float` keyframe), self-removes after ~2.4s.
- Create: `app/widgets/reaction-overlay/ui/reaction-picker.tsx` — the 5-emoji row (also reused in the sidebar).
- Create: `app/widgets/reaction-overlay/model/reaction-behaviour.ts` + test — dedupe burst, cap concurrent, auto-expire.

**Interfaces:**
- `ReactionOverlay` subscribes `ReactionStore.active`, renders `ReactionFloat`s at pseudo-random x-positions near the bottom of the video; each expires and is removed (cleanup on timeout).
- `ReactionPicker` calls `send(emoji)`; the store optimistically adds to `active`, server confirms via `burst`.

**Design cues (Netflix/Apple TV):**
- Reactions float up from the bottom-center and drift with slight sway; opacity fades out. Reduced motion → a single short crossfade. Cap concurrent floats (e.g. 12) to avoid noise.
- Presence: "Alice is watching" subtle status + `member-joined`/`left` pill toasts.

- [ ] **Step 1: Write failing tests** for reaction-behaviour (five categories: dedupe, cap, expiry, empty, burst order).

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Implement** the overlay, float, picker, and behaviour.

- [ ] **Step 4: Browser-verify** — trigger reactions from a viewer tab, confirm floats render over the host video, auto-expire, screenshot.

- [ ] **Step 5: Run tests — PASS. `deno task verify`.**

- [ ] **Step 6: Commit** — `Feat: crafts animated reaction overlay with dedupe and cap`.

---

## Task 11: Error UI surfaces (PRD §3.4.5) + recovery

**Files:**
- Create: `app/shared/ui-kit/inline-error.tsx` — field-level (icon + message + code caption).
- Create: `app/shared/ui-kit/error-banner.tsx` — persistent dismissible banner with one primary recovery action.
- Create: `app/shared/ui-kit/error-screen.tsx` — full-screen (route/root error boundary): title, message, code, recovery/home action.
- Create: `app/shared/api/error-bridge.ts` — maps any caught error to the `AppError` shape + severity + recovery.
- Modify: `app/root.tsx` `ErrorBoundary` → use `ErrorScreen` (styled per DESIGN.md, script voice for warmth).
- Create: `app/shared/api/error-bridge.test.ts` — five categories (recoverable → recovery action surfaced; non-recoverable → terminal screen; unknown → `SERVER_INTERNAL`; etc.).

**Interfaces:**
- `ErrorScreen` accepts `AppErrorPayload` (from `contracts/app-error-payload.ts`); renders message + code caption + recovery button wired to `recovery.action.kind` (retry/reconnect/home/choose-source/resync).
- Toast surface (transient) is the existing styled sonner wrapper from Task 3.

**Design cues (Apple HIG — error guidance):**
- What happened + why + what to do, in plain language. Calm, specific, non-blaming. Primary recovery action is the visible button. Error code as a small subdued `Code:` caption (copyable), never raw stack. `prefers-reduced-motion` → instant.

- [ ] **Step 1: Write failing tests** for error-bridge. Five categories.

- [ ] **Step 2: Run — expect FAIL.**

- [ ] **Step 3: Implement** the four surfaces + bridge; wire ErrorBoundary.

- [ ] **Step 4: Browser-verify** — trigger a recoverable error (bad URL) and a non-recoverable one (room ended), screenshot each.

- [ ] **Step 5: Run tests — PASS. `deno task verify`.**

- [ ] **Step 6: Commit** — `Feat: adds HIG-conformant error surfaces with recovery paths`.

---

## Task 12: Motion + micro-interaction polish sweep

**Files:**
- Modify across crafted surfaces; add `app/shared/ui-kit/motion.ts` — shared easing tokens + `useReveal` hook.
- Add `app/shared/ui-kit/motion.test.ts` — unit test the easing map + reduced-motion guard.

**Design cues (Netflix/Apple TV):**
- Consistent entrance language: ease-out-expo `cubic-bezier(0.16,1,0.3,1)`, 300–450ms, staggered within lists, crossfade fallback under reduced motion.
- Hover micro-interactions: buttons lift 1px + brighten; posters scale 1.02 with a subtle shadow; playhead thumb grows on hover.
- Nothing animates layout properties; transform/opacity/blur only.

- [ ] **Step 1: Write failing tests** for the easing map + reduced-motion hook. Five categories.

- [ ] **Step 2: Run — expect FAIL.**
- [ ] **Step 3: Implement** `motion.ts` + sweep the surfaces to use it consistently.
- [ ] **Step 4: Browser-verify** — animate through every surface, confirm no layout thrash, confirm reduced-motion (emulate) collapses all.
- [ ] **Step 5: Run tests — PASS. `deno task verify`.**
- [ ] **Step 6: Commit** — `Feat: standardizes motion and micro-interactions with reduced-motion fallbacks`.

---

## Task 13: Production build fix (react-dom/server SSR under Deno)

**Files:**
- Investigate `deno task build && deno task start` — the stale `react-dom/server` export resolution (`renderToPipeableStream`) under Deno's node-compat.
- Likely fixes: pin a Deno-compatible `react-dom` entry via `deno.json` import override (`react-dom/server` → a specific export), or adjust `entry.server.tsx` to use the streaming render path Deno resolves, or add a Deno-targeted build shim.
- Add a build smoke to the plan's verify story: `deno task build && deno task start`, then `curl /healthz`.

**Interfaces:**
- `deno task build` produces `build/server/index.js`; `NODE_ENV=production deno run -A server/app/entry.ts` boots and serves SSR HTML.

- [ ] **Step 1: Reproduce** — run `deno task build && deno task start`; capture the exact export error.
- [ ] **Step 2: Investigate** the resolution (grep `react-dom` exports in the built bundle + deno.lock).
- [ ] **Step 3: Implement** the minimal fix (import-map override or entry change), verify `deno task start` serves the homepage over `http://localhost:5173/`.
- [ ] **Step 4: `deno task verify`** — PASS.
- [ ] **Step 5: Commit** — `Fix: resolves react-dom/server SSR export under Deno production build`.

---

## Task 14: Final HIG + quality pass

**Files:**
- Review pass across all surfaces; fix contrast, spacing, overflow, a11y, focus, reduced-motion.
- Run the headless browser over every route (home, setup, upload, host player, receiver player) at desktop + 375px; screenshot; fix anything off.

**Checks:**
- WCAG AA contrast everywhere (automated + spot-check).
- Keyboard-only navigation works end-to-end (Tab order, focus trap in modal, Esc, no dead ends).
- `prefers-reduced-motion` collapses all motion; `prefers-color-scheme` respected; manual theme toggle persists.
- No console errors; `deno task verify` green; all routes render.

- [ ] **Step 1: Run the browser pass** over all routes/sizes; log issues.
- [ ] **Step 2: Fix** each issue (inline, small commits per surface if large).
- [ ] **Step 3: Final `deno task verify` + browser re-screenshot.**
- [ ] **Step 4: Commit** — `Chore: final HIG consistency and quality pass`.

---

## Self-Review

- **Spec coverage:** F1–F4 (Task 6 join + Task 9 sidebar), F5/F16–F18 (Task 9 host tools), F7–F9 (Task 7 source picker + Task 4 metadata), F10–F13 (Task 8 player shell + Task 1 playback store), F14–F18 (Task 9), F19–F21 (Task 9 chat), F22–F23 (Task 10 reactions), F30 (Tasks 3, 12, 14 + DESIGN.md). Error model (Task 11). All P0 features have a task.
- **Apple HIG:** applied globally (Tasks 3, 5–12, 14) — clarity/deference/depth/implicit feedback, single primary action per surface, native dialog semantics, WCAG AA, reduced motion.
- **Netflix/Apple TV richness:** motion (12), metadata posters/backdrops (6), auto-hiding stage (8), reactions (10), polished empty/error states (6, 11).
- **Placeholder scan:** every task has test code + implementation steps; no TBDs.
- **Type consistency:** all slices use Phase 1 contract types (`Member`, `PlaybackSnapshot`, `ChatMessage`, `Reaction`, `AppErrorPayload`, `MovieMetadata`); `SOCKET_EVENTS` names match the Phase 1 handlers.
