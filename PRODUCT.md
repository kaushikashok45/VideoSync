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

## Brand Personality

Warm, playful, cinematic. The brand name is a hand-drawn script (Yesteryear);
the system voice is confident and friendly. 3 words: **warm, cinematic,
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

## Accessibility & Inclusion

- WCAG AA contrast for all text (≥4.5:1 body; ≥3:1 large).
- Full `prefers-reduced-motion` support — every animation has a non-motion
  fallback.
- Keyboard-operable controls (playback, chat, reactions) with visible focus
  states.
- Room code entry and error messaging must work for screen readers (aria labels,
  live regions for toasts/banners).
