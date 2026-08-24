# Discord-inspired room player redesign

## Goal

Redesign the in-room player so joining a room feels like entering a focused
watching community: the video remains the dominant surface, while chat,
presence, and room tools are visible without feeling bolted on.

## Visual direction

Use Discord's current desktop information architecture as the reference point:
dark layered surfaces, a compact left navigation stack, 8px-based spacing,
rounded controls, dense labels, and explicit room presence. Pair that shell
with Vercel/Geist restraint: black surfaces, crisp hairlines, compact system
typography, and white active states instead of a saturated accent field. Keep
Sync Party's product language in the room name, watch status, copy, and movie
metadata rather than copying either brand's marks.

### Token choices

- Room background: `#000000`
- Rail background: `#080808`
- Panel background: `#0a0a0a`
- Raised hover: `#1a1a1a`
- Primary ink: `#ededed`
- Secondary ink: `#a1a1a1`
- Muted ink: `#666666`
- Active control: `#ffffff`
- Active control ink: `#000000`
- Live green: `#46c37b`
- Divider: `rgba(255,255,255,.06)`

Typography uses the existing system sans stack, with monospace retained only
for room codes, timestamps, and connection state labels.

## Layout and states

### Default room state

The page is a full-height grid with a 56px server rail, a 224px room rail, a
flexible player stage, and a 320px room sidebar. The player stage owns the
remaining width and is visually separated by a thin border rather than a
shadow. The sidebar opens in Chat by default and exposes Members, Chat, and
Settings as explicit utilities.

### Maximized state

Maximized mode removes the server and room rails and expands the player to the
viewport. The top-right action cluster stays visible and includes Chat,
Settings, and Exit. Chat and Settings become right-side drawers only after the
corresponding icon is clicked. Escape closes a drawer; leaving maximized mode
returns to the prior room state.

### Responsive state

At tablet widths, the room rail collapses to the server rail and the sidebar
becomes an overlay drawer. At mobile widths, both navigation rails collapse and
the player becomes a tall focused stage; chat and settings remain bottom-sheet
or drawer utilities.

## Component/data boundaries

- `PlayerShell` owns stage size, maximized state, playback controls, and the
  stable video element.
- `RoomSidebar` owns Chat, Members, Settings tab state and panel focus.
- `PlayerHeader` owns room identity, live/sync status, and utility entry points.
- Existing playback, member, chat, reaction, and socket stores remain the
  source of truth; the redesign must not add duplicate room state.
- The standalone mockup is interaction-only and uses static sample data. It is
  a visual contract, not a second production implementation. Its player
  controls use a dedicated seeker row, a centered playback cluster below it,
  and right-aligned volume/fullscreen utilities. Rewind/forward use the
  existing rotate-arrow plus `10` overlay treatment.

## Interaction requirements

- Every icon has an accessible name and visible focus state.
- Chat and settings are closed by default in maximized mode and open only from
  their named controls.
- The active state is communicated by icon + label + contrast, never color
  alone.
- Reduced-motion users receive the same state changes without slide animation.
- The video element remains mounted while controls, chat, or settings change.

## Verification

- Inspect the standalone mockup at desktop, tablet, and mobile widths in the
  in-app browser before React implementation.
- Verify room state, maximized state, chat drawer, settings drawer, Escape
  dismissal, visible focus, and reduced-motion CSS.
- After integration, run `deno task verify` and re-check the rendered player in
  the in-app browser.
