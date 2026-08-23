# Now Playing Redesign and Stable Playback Design

## Goal

Make the host now-playing route feel like the approved Vercel/Geist and Tailark Dusk direction while keeping video playback stable during control visibility changes and sending a selected source directly to the live player.

## Visual direction

- Use the approved `MASTER.md` Afterglow tokens: pure black stage, white/gray hierarchy, hairline boundaries, Bricolage Grotesque/Karla/monospace roles, and signal blue only for focus/live status.
- Keep the player video as the sole focal surface. Top chrome is transparent black with low-contrast branding; bottom metadata is quiet and does not introduce a separate card or explanatory copy.
- Center rewind 10, pause/play, and forward 10 controls. Use existing stroke icon primitives where available, with accessible labels that include the exact 10-second action.
- Place reaction entry centered above the seeker. Keep chat and room settings as icon-only controls with accessible names. Keep volume and fullscreen at the far right.
- Show a subtle `N watching` count and an `In sync` status using the existing member store and signal-blue status cue.

## Behavior

- Player controls remain mounted at all times; idle visibility changes only opacity/transform/pointer interaction. This prevents the video element and playback synchronization subtree from remounting when controls appear/disappear.
- The seeker uses a local draft value while the pointer/keyboard interaction is active, commits one seek command on release/change, and resumes from the committed position without pausing an already-playing video.
- The playback store's seek step is 10 seconds for rewind/forward, clamped to `[0, duration]`.
- Selecting a source from the source screen navigates directly to `HostVideoPlayerNew` with the source handoff in the store; the preview route remains available only for an explicit preview query.

## Verification

- Add/adjust tests for direct source-to-player navigation, seeker commit behavior while playing, 10-second controls, stable mounted control structure, and the synced/member status.
- Run `deno task verify` in the requested worktree.
