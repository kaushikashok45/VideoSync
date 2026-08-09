# Product

## Register

product

## Users

Friends, family, and small communities (up to ~15 people) who want to watch a
video together in real time from different places. The host is one person who
has a video file or URL and wants to share the experience; viewers join via a
short room code and follow along. Context: casual, social, low-commitment — a
"hey, I have this thing, watch it with me" moment, not a formal meeting.

## Product Purpose

The Sync Party ("The Sync Party") is a realtime synchronized video watch party.
A host starts a room from a local file or a public URL; viewers join by code and
watch in lock-step — play, pause, seek, forward, rewind, and volume stay in sync
across every peer. Chat and emoji reactions make it feel shared, not just
streamed. Success is a room where nobody has to say "wait, I'm not there yet" —
the watching _feels_ together.

## Core user experience

The product flow is a clear sequence:

1. Establish or join a room.
2. Confirm the room identity and who is present.
3. Choose a media source (host) or wait for the host's source (viewer).
4. Preview readiness: show the selected source, connection, and who can start.
5. Start playback.
6. Watch together with synchronized playback, presence, chat, and reactions.

Each screen has one primary user goal and one visually dominant next action.
Secondary actions remain available without competing with that action.

## Approved journey direction

The complete journey is designed as a progressive-disclosure sequence:

1. **Landing:** “Start a party” is the dominant action. “Join a room” is a
   quieter secondary action that expands an inline room-code field.
2. **Room identity:** room code, role, participant presence, invite, and
   connection state remain visible before the user commits.
3. **Media setup:** upload is the first host source path. URL entry appears as a
   secondary option only when requested.
4. **Readiness:** the media preview is the stage; source readiness, presence,
   invite, and start authority are supporting context.
5. **Player:** the approved interaction model is Native TV with centered
   controls. A compact bottom-center capsule owns playback and room-tool entry;
   reactions sit immediately above it; chat, people, invite, and room details
   open contextually from the menu.

The player is the product’s crux. Its chrome recedes after inactivity, returns
on pointer, touch, keyboard, or focus interaction, and never competes with the
video. Sync health is stated beside playback context in plain language such as
“Synced,” “Catching up,” or “Waiting for host.”

## User expectations

- **Room identity:** the room code/name and current role are visible and
  confirmable before a user commits to joining or sharing.
- **Sharing:** copying or sharing an invite gives immediate, local confirmation
  of what was shared and leaves the user in the room context.
- **Source selection:** the host can distinguish local file and URL sources,
  sees validation beside the source control, and knows which source is active.
- **Loading and validation:** activity indicates what the system is doing;
  validation states identify the problem and the correction, without resetting
  valid input or losing context.
- **Playback readiness:** before start, participants can tell whether the source
  is loaded, the connection is usable, and who has authority to start.
- **Synchronization:** playback state, connection health, and meaningful drift
  are communicated in plain language; the interface never implies everyone is
  synchronized when the system knows otherwise.
- **Recovery:** a failed join, source load, share action, or connection gives a
  recoverable next step such as retry, replace source, copy the invite again, or
  return to the room.

The interface must communicate current state, system activity, success, failure,
and next action without requiring users to infer meaning. Feedback belongs near
the control or content that caused it; global messages supplement rather than
replace contextual explanation.

## What “smooth” means

A smooth experience has low cognitive load, stable layout, immediate feedback,
predictable navigation, preserved room context, fast perceived response, and
recoverable errors. It is not merely a fast transition or a small number of
breakpoints: the user should always understand what changed, why it changed, and
what can happen next.

## Brand Personality

Warm, playful, cinematic, social, and trustworthy. The approved wordmark is an
Avenir-style sans treatment: “Sync” carries the semibold emphasis while “Party”
is lighter. The product UI uses a calm Apple/SF-style system sans so the brand
can feel human without making controls decorative. The experience should feel
like a shared movie night: inviting and human, but precise enough that room
identity, playback, and recovery can be trusted. 3 words: **warm, cinematic,
effortless.**

## Anti-references

- Generic SaaS dashboards (sidebar + gray cards + blue accent).
- Busy "streaming app" chrome — dark UI crowded with logos, shelves, and badges.
- Overly cutesy or toy-like design that undercuts the "cinema" feel.
- Anything that makes the _watching_ feel secondary to the chrome around it.

## Design Principles

1. **The video is the stage.** UI recedes; chrome appears on demand and gets out
   of the way. A dark, low-contrast shell frames the content.
2. **Together-feel first.** Every control that syncs playback, every reaction,
   every chat line exists to make co-watching feel immediate — not to add
   features.
3. **One glance, zero confusion.** Room codes, join, and the playback state must
   be legible in a single glance; error messages say what happened and how to
   recover.
4. **Warm confidence.** The red-accent warmth and the script brand mark make the
   tone friendly; precision in spacing/type makes it feel built, not doodled.
5. **Effortless entry.** Joining a room is one link + one name. Nothing stands
   between the host's invite and the shared moment.
6. **Clarity over novelty.** Prefer familiar controls, explicit labels, and
   predictable navigation over clever interactions that require discovery.
7. **Contextual feedback over generic notifications.** Explain state beside the
   action or content that caused it, with a clear recovery path.
8. **Progressive disclosure over overload.** Show the decision needed now and
   reveal supporting detail when it becomes relevant.
9. **Meaningful motion over ornament.** Use motion to communicate hierarchy,
   cause/effect, progress, or state transition; do not animate for decoration.
10. **Responsive experience, not breakpoint compliance.** Mobile, tablet, and
    desktop must each preserve task clarity, reachable actions, room context,
    and the shared-watch feeling.
11. **The player is a stage, not a dashboard.** Playback owns the center; social
    tools are close enough to feel shared and quiet enough to stay secondary.
12. **Use the 8pt rhythm.** Layout, controls, gaps, and surfaces resolve to the
    8px grid, with a 4px micro-step reserved for optical alignment.

## Quality criteria

A high-quality screen satisfies all of these conditions:

1. The user understands where they are.
2. The user understands what is happening.
3. The user knows what to do next.
4. The user can complete the action without confusion.
5. The interface communicates success or failure clearly.
6. The experience remains usable across viewport sizes and input methods.

## Product review checklist

Review every meaningful screen or flow for:

- first impression: the room and purpose are recognizable quickly;
- task clarity: one primary goal and one dominant next action;
- contextual state: loading, validation, success, failure, empty, readiness,
  synchronization, and recovery are understandable;
- branding: cinematic, social, playful, warm, and trustworthy without task
  interference;
- accessibility: semantic structure, labels, accessible names, keyboard paths,
  visible focus, contrast, touch targets, and reduced-motion behavior;
- responsiveness: mobile, tablet, and desktop preserve hierarchy, reading order,
  reachability, and room context;
- performance: feedback is immediate, layout is stable, and perceived waiting
  explains system activity;
- recovery: errors preserve useful input and provide a specific next action.

## Accessibility & Inclusion

- WCAG AA contrast for all text (≥4.5:1 body; ≥3:1 large).
- Full `prefers-reduced-motion` support — every animation has a non-motion
  fallback.
- Keyboard-operable controls (playback, chat, reactions) with visible focus
  states.
- Room code entry and error messaging must work for screen readers (aria labels,
  live regions for toasts/banners).
