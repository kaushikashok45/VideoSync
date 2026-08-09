# Sync Party UI Redesign

## Goal

Bring the pre-play frontend surfaces into one dark-cinema visual system that makes the room identity, current task, and next action obvious without competing with the future video stage.

## Direction

- Keep `#0d1117` as the room, layered with the existing surface tokens and warm red brand accent.
- Use Yesteryear only for the brand mark and rare empty-state voice; use Overpass for headings, copy, labels, and controls.
- Treat the media frame as the visual stage. Entry screens use a two-column workspace on desktop and a single task column on mobile.
- Use one canonical button/input/badge vocabulary and reserve cards for meaningful context: room identity, source selection, and now-playing details.
- Remove decorative uppercase labels, arbitrary oversized radii, and redundant legacy components from the entry path.

## Scope

Landing, room setup, source selection, and shared UI-kit primitives used by those screens. Existing routes, state transitions, media behavior, and room/socket logic remain unchanged.

## States and accessibility

Primary buttons expose default, hover, focus, pressed, disabled, and loading states. Text fields retain visible labels and inline errors. Room copy actions provide local success feedback. All controls remain keyboard reachable, touch-friendly, and honor reduced motion.

## Verification

Run the Deno build and `deno task verify`. Inspect the landing, setup, and source screens at mobile, tablet, and desktop widths, including invalid-room, loading, validation-error, and selected-source states.
