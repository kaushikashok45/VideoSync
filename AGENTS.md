# AGENTS.md — VideoSync ("The Sync Party")

Governance and operating rules for AI agents working in this repository. This is
the single source of truth. CLAUDE.md imports it and adds Claude-specific rules.

## Project overview

Real-time synchronized video watching. A host uploads a video file, receivers
join a room by link, and playback (pause/resume/seek/forward/rewind/volume)
stays in sync across all peers.

- **App**: React 19 + React Router v7 (framework mode, SSR, `flatRoutes`)
- **Signaling**: Express + Socket.IO over HTTP
- **Media**: WebRTC via `simple-peer` (P2P stream + data channel for control
  events)
- **Runtime**: Deno (2.x) — the project runs on Deno, not Node. Node is **not**
  required.
- **Package manager**: Deno's built-in (`deno.json` + `deno.lock` +
  `deno install`). No `package.json`.
- **Styling**: Tailwind CSS 3 + React Compiler (babel plugin)

## Commands (all via `deno task`)

| Command                | What it does                                                                    |
| ---------------------- | ------------------------------------------------------------------------------- |
| `deno task setuphttps` | Generate self-signed `localhost.key`/`localhost.pem` (run once after clone)     |
| `deno task dev`        | Dev server (`deno run -A server/app/entry.ts` — Express + Socket.IO + Vite HMR) |
| `deno task build`      | Production build via React Router CLI (runs Vite)                               |
| `deno task start`      | Serve production build (`NODE_ENV=production deno run -A server/app/entry.ts`)  |
| `deno task lint`       | `deno lint`                                                                     |
| `deno task fmt`        | `deno fmt`                                                                      |
| `deno task check`      | `deno check --sloppy-imports app server` (typecheck)                            |
| `deno task test`       | `deno test -A --sloppy-imports`                                                 |
| `deno task verify`     | fmt-check + lint + check + test (run before finishing any task)                 |
| `deno install`         | Install/sync npm dependencies into `node_modules` (managed by Deno)             |

**The build and typecheck pipelines have already been verified to work under
Deno.** Do not reintroduce `package.json`, `yarn.lock`, `.yarnrc.yml`, ESLint,
or `tsc` — Deno replaces all of these.

## Architecture

> **Authoritative source: PRD §3 (Feature-Sliced Design).** The FSD target tree,
> layer direction, and slice internals (`ui/ model/ api/ lib/`) are defined in
> `docs/specs/2026-08-08-sync-party-v2-prd.md` §3. This section no longer
> restates the tree; it records only the two facts §3 omits and the enforcement
> pointer.

**Layer order (enforced by `deno task check:boundary`):**

```
app/     shared(0) ← entities(1) ← features(2) ← widgets(3) ← pages(4) ← app(5)
server/  shared(0) ← entities(1) ← features(2) ← app(3)
```

A module may import its own layer and lower-numbered layers only. Cross-slice
imports at the same layer must go through the target slice's `index.ts` public
entry — never a deep import into its internals.

**`shared/contracts/` is a layer −1 protocol root.** It sits at the repo root as
a sibling of `app/` and `server/` (not nested under either), aliased as
`contracts/` in `deno.json`. It holds **only** the wire protocol — socket
events, data-channel payloads, and the shared `AppError` model — shared by both
roots. Both `app/` and `server/` may import from it; it imports from neither.
Anything UI-only or server-only does not belong here.

**Historical note.** The pre-FSD `components/ logic/ contracts/ types/` layout
is frozen as a **legacy zone** (directory list in `docs/GOVERNANCE.md`): exempt
from the boundary checker, ratcheted so it may only shrink, and migrated
slice-by-slice toward the FSD layout in PRD §3. Do not add new files there.

**How every rule in this file is enforced:** see `docs/GOVERNANCE.md` — the
single map of rule → owning document → enforcing `deno task` → blocking or
advisory.

### Data flow

- Host picks a video file, uploads/URL, navigates to the host player.
- Receiver joins via `/roomId` share link, names themselves, reaches the
  receiver player.
- Socket.IO signaling (`join-room`, `signal`) establishes a P2P `simple-peer`
  connection.
- Host captures the video as a `MediaStream` and streams it to receivers over
  WebRTC.
- Playback control events flow host→receiver over the peer **data channel** as
  JSON `{ type, ...payload }`; the video element dispatches `CustomEvent`s (e.g.
  `pause-playback`, `seek-playback`) that the route-level logic listens for and
  relays.
- Every peer manager/socket manager has a `Base*` abstract class; `Host*` and
  `Reciever*` subclasses implement role-specific behavior.

## Conventions

### Module layout (mandatory)

Every **slice** (a folder under `entities/`, `features/`, `widgets/`, `pages/`)
keeps the FSD internal split. Each part is enforced:

- `ui/` — presentation only. **Props-only**: no store/`model/`/`api/` import, no
  `useState`/`useEffect`/`useReducer`. All state and callbacks arrive as props,
  so a `ui/` component renders in a test with no providers.
  (`deno task check:dumb-ui`)
- `model/` — behaviour: stores, state transitions, invariant-enforcing entity
  code. No JSX. Domain code here may not import a concrete transport
  (`socket.io`, `simple-peer`, `express`). (`deno task check:semantics`)
- `api/` — the transport edge: the only place a concrete socket/peer client is
  named. External data is parsed here (parse-don't-validate).
- `lib/` — slice-private pure functions. Unreachable from outside the slice by
  construction (`deep-import` rule), so it is where extracted helpers live —
  **never** a `utils.ts`/`helpers.ts` bag. (`deno task check:boundary`)
- `contracts/` — shared type shapes (`.d.ts` namespace contracts) and
  `constants.ts` for event names. The only cross-slice-importable types.
- `index.ts` — the slice's **only** public entry. Cross-slice imports target
  this and nothing deeper; its public-export cap is defined in
  `docs/GOVERNANCE.md` (`public-surface-cap`). Authored **before**
  implementation (contract-first). (`deno task check:boundary`)

The legacy `components/ logic/ types/` split survives only in the legacy zone
(see Architecture). Do not create new slices with it.

### File segregation (mandatory)

**One entity / type / function per file.** Do not mix several types, entities,
and functions into a single file.

- **Type definitions get their own file** (`foo-type.ts` or the type's name,
  e.g. `error-code.ts` for `type ErrorCode`).
- **Classes get their own file** (`app-error.ts` for `class AppError`).
- **Functions get their own file** unless they are the single public API of a
  small module that owns one responsibility.
- **Entities get their own file** (`member.ts` for the `Member` entity, not a
  grab-bag of `member`, `room`, and `message`).
- A contract module is a directory of these small files, not one big
  `contracts/types.ts`. Do not create `utils.ts`/`types.ts`/`helpers.ts` dumping
  grounds.
- Exception: a tiny private helper used only by one module may live beside it; a
  cohesive enum + its consumer type may share a file only when they are one
  concept (e.g. `MemberRole` inside `member.ts`). When in doubt, split.

### Naming

- **"Receiver" is the correct spelling.** The codebase historically used
  `Reciever*` (`RecieverSocketManager`, `RecieverVideoPlayerNew`). New code
  **must** use `Receiver`. Existing `Reciever*` files are slated for a rename
  refactor — do not create new `Reciever*` names.
- Managers: `Base*Manager` (abstract), `Host*Manager`, `Receiver*Manager`.
- Hooks: `useXBehaviour` for UI-tied logic hooks.
- Event names are string constants in the feature's `contracts/constants.ts`,
  not inline strings.
- Handlers named `handleX`; classes name types in the contract with camelCase
  (`peerConfig`, `socketParams`).

### Imports

- Internal app code: relative imports, or `~/` alias → `./app/*` (both work
  under Deno sloppy imports and Vite).
- npm deps: bare specifiers (`import { toast } from "sonner"`) resolved via
  `deno.json` imports / `node_modules`.
- Node built-ins: `node:` prefix (`node:https`, `node:fs`).
- Extensionless imports are allowed (enabled via `sloppyImports` in `deno.json`
  and Vite resolution).

### Types

- `strict` mode is on. `deno check` is the typechecker — it **must** pass before
  work is done.
- Prefer typed contracts in `contracts/` over inline types for shared shapes.
- Avoid `any` (lint-enforced). Use `unknown` + narrowing, or precise event
  types.
- Type-only exports use `type`/`interface` keywords; import with `import type`.
- Overriding methods must use the `override` keyword (lint-enforced).
- Refs: React 19's `useRef<T>(null)` yields `RefObject<T | null>` — type prop
  contracts accordingly.

### React

- React Compiler is enabled. Do not hand-optimize with `useMemo`/`useCallback`
  for compiler purposes; the React Compiler babel plugin handles memoization
  automatically.
- Functional components + hooks. No class components.
- Follow the existing UI/logic split — do not inline business logic into JSX.

### Styling

- Tailwind utility classes only. Dark mode is supported via `dark:` variants.
- Fonts: `yesteryear`, `overpass`, `sans` are configured in
  `tailwind.config.ts`.

### UI/UX implementation rules

- **Hierarchy first.** Every screen and component must make the current
  location, primary task, and next action visually obvious. Use size, weight,
  position, spacing, and contrast intentionally; do not let secondary chrome
  compete with the primary task.
- **Reuse the system.** Before creating a token, primitive, component, type
  role, spacing value, color variable, or motion utility, use the existing
  design tokens and shared UI primitives defined in `DESIGN.md` and the existing
  component library. A new abstraction is allowed only when the existing one
  cannot express the requirement; document the concrete reason in the change and
  make the new abstraction reusable.
- **One canonical pattern.** Shared patterns such as buttons, fields, feedback,
  overlays, cards, and player controls have one canonical implementation. Extend
  or configure it rather than creating parallel local versions with different
  behavior or styling.
- **Complete interaction states.** Every interactive component must define the
  applicable loading, disabled, hover, focus, pressed, success, error, and
  reduced-motion behavior. States must be communicated with more than color
  alone, and a disabled control must have an understandable reason or
  prerequisite visible in context.
- **Contextual feedback.** Every empty, loading, error, and success state must
  explain the current state and the next available action. Put the message
  beside the control or content that caused the state; use global notifications
  only for events that have no useful local anchor.
- **Accessible by construction.** Use semantic HTML, visible labels, unique
  accessible names, keyboard support, visible focus states, adequate contrast,
  and touch-friendly targets. Do not make an icon, placeholder, color, or
  hover-only affordance carry meaning by itself.
- **Responsive behavior is part of implementation.** Test layouts and key
  interactions at mobile, tablet, and desktop widths, including long labels,
  narrow room codes, zoomed text, and touch/keyboard input. Preserve hierarchy
  and task completion rather than merely preventing overflow.
- **Stable, calm surfaces.** Prevent overlapping text, unexpected layout shifts,
  duplicated labels for the same concept, and decorative UI that competes with
  the primary task. Reserve motion and emphasis for hierarchy, cause/effect,
  progress, and state transition.
- **Visual verification is required.** A design change is not complete after
  typechecking and tests alone. Inspect the rendered result at the required
  viewport widths and verify hierarchy, spacing, state coverage, responsive
  composition, focus behavior, and reduced-motion behavior.

### Minimality and reuse rules

- **Make the smallest viable change.** Implement the requested behavior and its
  necessary tests; do not add speculative features, wrappers, dependencies,
  configuration, or unrelated cleanup.
- **Search before creating.** Locate existing code, contracts, primitives,
  utilities, and dependencies before adding new ones. Extend the current owner
  when it already has the responsibility.
- **Keep one source of truth.** Shared behavior, state transitions, constants,
  and data transformations must have one canonical owner. Do not copy logic into
  a second feature or create pass-through layers without a boundary reason.
- **Use DRY with judgment.** Remove meaningful duplication, but do not create a
  generic abstraction for code that is only coincidentally similar. A new
  abstraction must have a current consumer and a documented reason.
- **Prefer simple designs.** Follow KISS and YAGNI: choose direct, readable code
  over cleverness, premature optimization, speculative extensibility, or
  unnecessary indirection.
- **Preserve scope and behavior.** Do not mix unrelated refactors, formatting
  churn, renames, dependency changes, or architecture changes into a task.
  Remove dead code only when it is directly made obsolete by the change.
- **Review for excess.** Before completion, look specifically for duplicated
  logic, unused code, pass-through wrappers, redundant state, unnecessary
  branching, and files or dependencies that the change did not need.

### Coding standards & review

- **`docs/CODING_STANDARDS.md` is authoritative** for size/structure limits, and
  **`docs/GOVERNANCE.md` is authoritative for _how_ each rule is enforced** —
  the task, plugin, or panel that checks it. No rule is enforced by hoping an
  agent read this file; every limit below is a machine check, a lint plugin, or
  a named reviewer lens.
- Structural limits — cyclomatic complexity, body length, file length, nesting
  depth, param count — are defined **only** in `CODING_STANDARDS.md §1` and are
  machine-enforced by `deno task check:structural`. The numbers are not repeated
  here. New and changed code is hard-blocked on any violation; existing
  violations are frozen by the ratchet baseline and may only decrease.
- `deno lint` runs the recommended tag as errors plus the four project plugins
  (`structural`, `boundary`, `dumb-ui`, `semantics`). `no-undef` stays off
  (noise on browser/Node globals); `reviewer-correctness` catches genuine
  undefined identifiers instead.
- **Every commit is gated by a cold reviewer panel of four fresh, independent
  subagents.** See `docs/CODING_STANDARDS.md §5` for the panel roster, lenses,
  and aggregation rule. Run it with `/review-now`.
- **PRs are feature-sized and small enough to review in one sitting.** See
  `docs/CODING_STANDARDS.md §6` for the size limits. Oversized work must be
  split before review.
- Every PR must pass `deno task verify` before review.

## Testing

- Deno's built-in test runner (`deno test`). No Jest/Vitest.
- Tests live next to the code: `foo.test.ts` alongside `foo.ts` (both under
  `app/` or `server/`).
- `@std/assert` is the assertion library (import `from "@std/assert"`).
- New logic must include tests. Pure logic (utils, contracts) is easiest to
  test.
- Run the whole suite with `deno task test`.

### Test coverage depth (mandatory)

Every module's tests must cover **all five categories** — not just the happy
path:

1. **Happy path** — the intended success flow.
2. **Sad path** — expected failures (validation rejected, not found, permission
   denied, rate-limited, etc.).
3. **Edge cases** — empty/null input, zero values, boundary values, first/last
   items, concurrent/repeated calls.
4. **Mutation cases** — tests that would FAIL if the implementation were subtly
   changed in a way that breaks the contract (e.g. swapping `>`/`>=`, dropping a
   guard, off-by-one, wrong clamp direction, dropping a field from a payload).
   Each critical branch of the code should have a test that pins its exact
   behavior.
5. **Logical limits** — the boundaries of the code's behavior: capacity limits,
   rate-limit windows, drift thresholds, clamp ranges, maximum message lengths,
   reconnect attempts. Test exactly-at-limit and just-beyond-limit.

## Git workflow

- **Branch naming**: `<type>/<short-description>` — e.g.
  `feat/receiver-stream-capture`, `fix/video-sync-race`,
  `refactor/receiver-rename`, `chore/deps`, `docs/governance`.
- **Commit messages**: `<Type>: <subject>` where Type ∈ Feat, Fix, Refactor,
  Chore, Docs, Test, Build. Match existing history style
  (`Feat: Adds react compiler`, `Refactor: Migrates to react router v7`).
- Open a PR against `main` when a task is complete and verified. Never push
  directly to `main`.
- Before finishing any task run `deno task verify` and confirm it passes
  end-to-end.

## Guardrails

- Do **not** recreate Node/`package.json`/Yarn tooling. The project is
  Deno-native.
- Do **not** run `npm`/`yarn`/`npx` to install or run anything.
- Do not commit `localhost.key`, `localhost.pem`, `.env`, or build output
  (`/build`).
- Do not commit secrets. `deno.lock` and `node_modules` are handled by Deno
  (`node_modules` is gitignored).
- Do not "fix" the `Reciever*` spelling by renaming files inside an unrelated
  feature PR — it is its own refactor.
- Keep socket event names and data-channel message types in sync between
  `webSocket` and `webRTC` contracts.
- `server/app/entry.ts` is the server entry point — if you need to add socket
  events, add them in `server/app/server.ts`, and mirror the event names in the
  client `contracts/constants.ts`.
