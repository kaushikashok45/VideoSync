# Sync Party UI Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the pre-play entry flow feel like one warm, cinematic, accessible product surface.

**Architecture:** Preserve the feature-based React structure. Update shared UI-kit primitives first, then compose them in the entry-flow layout and screen components; do not change room, media, or socket behavior.

**Tech Stack:** React 19, React Router v7, Tailwind CSS 3, Deno 2, Deno test runner.

## Global Constraints

- Use the existing design tokens from `DESIGN.md`; do not add a second palette.
- Use Tailwind utilities and existing component boundaries.
- Keep functions under 20 lines where practical and avoid unrelated cleanup.
- Run `deno task verify` before completion.

### Task 1: Align shared UI primitives

**Files:**
- Modify: `app/shared/ui-kit/button.tsx`
- Modify: `app/shared/ui-kit/text-field.tsx`
- Modify: `app/shared/ui-kit/badge.tsx`

- [ ] Update base states, typography, and focus treatment to match the design tokens while preserving public props.
- [ ] Run focused UI-kit tests with `deno test -A --sloppy-imports app/shared/ui-kit/button.test.tsx app/shared/ui-kit/text-field.test.tsx`.

### Task 2: Refine entry-flow composition

**Files:**
- Modify: `app/features/entry-flow/components/entry-layout.tsx`
- Modify: `app/features/entry-flow/components/landing-screen.tsx`
- Modify: `app/features/entry-flow/components/setup-screen.tsx`
- Modify: `app/features/entry-flow/components/source-screen.tsx`
- Modify: `app/features/entry-flow/components/media-frame.tsx`

- [ ] Establish the stage/workspace hierarchy and responsive stacking.
- [ ] Replace decorative labels and oversized card treatments with compact semantic context.
- [ ] Preserve loading, error, room mismatch, and source readiness copy beside the affected actions.

### Task 3: Refine source and room supporting controls

**Files:**
- Modify: `app/features/media-source/ui/source-picker.tsx`
- Modify: `app/features/media-source/ui/upload-dropzone.tsx`
- Modify: `app/features/media-source/ui/url-field.tsx`
- Modify: `app/features/room-join/ui/join-form.tsx`
- Modify: `app/features/entry-flow/components/room-identity-card.tsx`

- [ ] Make selection, drop, copy, and form states consistent and touch-friendly.
- [ ] Keep visible labels, inline errors, and local success feedback.

### Task 4: Verify

- [ ] Run `deno task build`.
- [ ] Run `deno task verify`.
- [ ] Inspect responsive output and fix only defects caused by this redesign.
