# Sync Party Complete Journey and Player Design Specification

## Status

Approved direction for implementation planning. This specification captures the
complete journey and makes the synchronized player—the product’s crux—the
canonical reference surface.

## Product intent

Sync Party should make a remote watch feel like a shared room, not a streaming
dashboard. The product gives a group one obvious next action at every step,
keeps room identity visible, and reveals supporting controls only when they are
relevant.

The design direction is **Native TV**: a quiet cinematic stage, system-like
product typography, precise spacing, and warm identity carried by the Sync
Party wordmark and red status/action accent.

## Approved design decisions

- Journey scope: landing → create/join → room identity → media setup →
  readiness → synchronized playback.
- Landing: `Start a party` is the dominant action; `Join a room` is secondary.
- Join flow: room-code entry expands inline on the landing surface.
- Host setup: upload is the first source path; URL entry is progressively
  disclosed as a secondary option.
- Readiness: video preview is the stage; presence and invite are supporting
  context before playback starts.
- Player model: centered controls. Playback controls appear in a compact,
  bottom-center capsule; social feedback sits above it; chat, presence, invite,
  and room tools open from the menu.
- Wordmark: Avenir-style `Sync Party` treatment. The existing Yesteryear font
  is not the canonical wordmark for this redesign.
- Layout: 8pt base grid with a 4pt micro-step for optical alignment only.

## Journey contract

### 1. Landing

Purpose: establish the shared-watch promise and start the most common path.

Primary action: `Start a party`.

Secondary action: `Join a room`, which expands an inline room-code field without
leaving the landing context.

Required states:

- Default: one dominant CTA, one quieter join affordance, room identity absent.
- Join expanded: visible label, room-code field, submit action, cancel/collapse
  action, and helper copy describing the code format.
- Invalid room code: inline error beside the field; preserve the entered value;
  explain the correction.
- Joining: disable only the submit action and show progress in its context.
- Join failure: explain whether the room was not found, closed, or unavailable;
  provide retry and return-to-entry actions.

### 2. Room identity

Purpose: establish a room and confirm identity before a user commits to sharing
or watching.

Required information: room code/name, current role, participant count, invite
action, and connection state. Room identity is persistent across setup screens.
Copy/share feedback is local to the action and must not displace the user.

### 3. Host media setup

Purpose: choose a source and understand whether it is usable.

Primary action: `Upload a video`.

Secondary path: `Use a URL`, revealed after the host asks for an alternate
source.

Required states:

- Empty: explain accepted source types and what happens next.
- Drag-over: show the drop target as active without layout shift.
- Uploading: preserve the selected filename and show determinate progress when
  available.
- Validation error: keep the source control and show a specific recovery path.
- Loaded: show filename, duration/metadata when available, and replace-source
  action.
- URL mode: visible label, validation beside the URL field, and a clear
  switch-back path to upload.

### 4. Readiness

Purpose: let the host know whether the room can start together.

The video preview owns the visual hierarchy. Supporting context exposes the
selected source, playback readiness, participant presence, connection health,
invite/share action, start authority, and recoverable errors.

Primary action: `Start watching` when the host and source are ready.

Receiver state: explain that the receiver is waiting for the host and show the
current readiness conditions without presenting a disabled action with no
reason.

### 5. Synchronized player

Purpose: watch together with confidence that playback state is shared.

The video is the stage. Chrome recedes after inactivity and returns on pointer,
touch, keyboard, or remote-style focus interaction.

#### Default composition

- Top-left: Avenir-style Sync Party wordmark.
- Top-right: room code and connection indicator.
- Lower-left when chrome is visible: title, current time, and shared-watch
  state.
- Lower-right when chrome is visible: `Synced`, `Catching up`, `Waiting for
  host`, or a recoverable connection state.
- Bottom-center: compact control capsule.
- Above the capsule: quick reactions and contextual feedback.

#### Control capsule order

1. Play/pause.
2. Rewind.
3. Forward.
4. Divider.
5. Room tools menu.
6. Reactions.
7. Divider.
8. Runtime value and seek track.

The order is stable across host and receiver roles. Role-specific availability
is communicated through disabled state and nearby prerequisite copy, not by
reordering controls.

#### Progressive disclosure and player states

- Chat, participant list, room details, and invite open from `Room tools`.
- Quick reactions stay one level closer because they are lightweight social
  feedback.
- Low-risk events such as reactions or copied invites get local confirmation.
- Sync and readiness states remain anchored beside playback context.
- Playing: controls hide after inactivity and return on interaction.
- Paused: play affordance and paused state are explicit.
- Seeking: timeline thumb and time value update together.
- Room tools open: use a top-layer popover/dialog or fixed surface that cannot
  be clipped by the player.
- Host waiting: explain that the host controls start/pause and show the next
  available action.
- Drift detected: say who is catching up and whether the user can continue,
  retry, or wait.
- Connection degraded: preserve playback context and offer reconnect/retry.
- Ended: show completion state and a clear replay/leave-room choice.

## Visual system

### Color

Use the existing Dark Cinema roles from `DESIGN.md`: near-black room/background;
raised and sunken surfaces; cool white primary ink; readable muted ink; warm
red for primary actions, playhead, focus, and selected state; and green,
yellow, or danger only for semantic connection and recovery state. Color never
carries state alone.

### Typography

- Product UI: Apple/SF-style system stack, fixed rem scale, readable at 200%
  zoom.
- Wordmark: Avenir-style sans treatment, semibold `Sync` with lighter `Party`.
- Room codes, timestamps, and runtime values: tabular monospace.
- Body copy: minimum 1rem, line-height 1.5–1.6, max measure ~70ch.
- Headings: balanced wrapping, no overflow at narrow widths, strong weight and
  spacing contrast rather than decorative display type.

### Spacing and geometry

- Base unit: 8px.
- Micro alignment: 4px only for optical correction.
- Canonical sequence: 8, 16, 24, 32, 40, 48, 64, 80px.
- Minimum practical interactive target: 44×44px.
- Player capsule: 16px radius; controls: 42–44px visual/hit targets.
- Contextual surfaces: 12–16px radius, full surface border, no accent stripes.

## Responsive behavior

- Desktop: stage dominates; capsule is centered; secondary context appears only
  in a contextual surface.
- Tablet: preserve control order and stage priority; reduce metadata before
  reducing control targets.
- Mobile: stage becomes a tall focused surface; room identity remains top-right;
  controls remain reachable; room tools become a full-width bottom sheet or
  fixed popover.
- At every width: no text clipping, control overlap, horizontal scrolling, or
  loss of the dominant next action.

## Accessibility and interaction requirements

- Semantic landmarks and heading order.
- Accessible names for every icon-only button.
- Visible `:focus-visible` ring with at least 2px contrast-safe treatment.
- Keyboard support for playback, seek, reactions, room tools, Escape dismissal,
  and focus return.
- Live regions for connection, sync, upload, and share feedback.
- Reduced-motion alternative for every transition.
- Errors adjacent to their source control and linked with `aria-describedby`.
- Disabled controls explain the prerequisite in nearby copy.

## Architecture guidance

Keep existing feature boundaries: player shell owns stage/chrome visibility;
playback-control owns playback behavior; reaction overlay owns quick reactions;
room tools owns participants, chat entry, invite, and room details; sync state
logic owns connection/drift/readiness language; and the shared UI kit owns
buttons, icon buttons, popovers, badges, and feedback primitives.

Do not duplicate playback event names, sync-state interpretation, or control
ordering between host and receiver routes.

## Verification contract

1. Run `deno task verify`.
2. Inspect desktop, tablet, and mobile player layouts.
3. Exercise default, hover, focus, pressed, disabled, loading, error, success,
   paused, seeking, drift, reconnect, and ended states.
4. Verify keyboard-only navigation and Escape/light-dismiss behavior.
5. Verify 200% zoom, long movie titles, long room codes, and empty participant
   lists.
6. Confirm the player stage remains dominant and controls never overlap the
   timeline, metadata, or contextual surfaces.

## Out of scope

- New backend synchronization protocol.
- New media codecs or streaming transport.
- Persistent watch history or a content catalogue.
- Chat semantics beyond its player entry point and contextual presentation.
- Renaming legacy `Reciever*` files; that remains a separate refactor.
