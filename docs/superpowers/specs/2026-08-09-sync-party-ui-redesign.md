# Sync Party UI Redesign

## Goal

Bring the pre-play frontend surfaces into one dark-cinema visual system that makes the room identity, current task, and next action obvious without competing with the future video stage.

## Direction

- Keep `#0d1117` as the room, layered with the existing surface tokens and warm red brand accent.
- Use the approved Avenir-style system sans for the brand mark and system sans for headings, copy, labels, and controls; reserve monospace for technical metadata.
- Treat the media frame as the visual stage. Entry screens use a two-column workspace on desktop and a single task column on mobile.
- Use one canonical button/input/badge vocabulary and reserve cards for meaningful context: room identity, source selection, and now-playing details.
- Remove decorative uppercase labels, arbitrary oversized radii, and redundant legacy components from the entry path.

## Scope

Landing, room setup, source selection, and shared UI-kit primitives used by those screens. Existing source validation, media behavior, and room/socket logic remain unchanged.

## Approved Host Source Flow

- The landing page's `Start a watch party` action creates the host room and
  navigates directly to `/:roomId/file-upload`.
- The host does not pass through `SetupScreen`; the setup route remains for
  receiver join and recovery paths.
- The source screen presents local file and public URL as equal source choices.
- A valid source submits directly to the host player. The page does not expose
  the room code; room identity appears after source selection in the existing
  host playback flow.

## Approved Source Screen Direction

- Reuse the existing entry shell vocabulary: `EntryLayout`, brand mark, theme
  control, landing-style menu navigation, and landing footer links.
- Use a dark-stage split composition on desktop: source task first, original
  spotlight artwork second. Stack the source task before the artwork on mobile.
- The spotlight artwork is project-owned SVG/CSS artwork: a red aperture,
  film-gate geometry, subtle grain, and concise poster typography. It requires
  no external image license or attribution.
- Artwork enters once with opacity, an approximately 8px translate, and light
  blur on the approved ease-out curve. It must not loop or use parallax, and
  `prefers-reduced-motion` removes the entrance motion.

## Out Of Scope

- Receiver join behavior and the setup screen's receiver UI.
- Changes to source validation, URL loading, peer signaling, or host player
  behavior.
- A poster catalog, recommendation system, or interactive artwork controls.

## States and accessibility

Primary buttons expose default, hover, focus, pressed, disabled, and loading states. Text fields retain visible labels and inline errors. Room copy actions provide local success feedback. All controls remain keyboard reachable, touch-friendly, and honor reduced motion.

## Verification

Run the Deno build and `deno task verify`. Inspect the landing, setup, and source screens at mobile, tablet, and desktop widths, including invalid-room, loading, validation-error, and selected-source states.
