# AGENTS.md — VideoSync ("The Sync Party")

Governance and operating rules for AI agents working in this repository. This is
the single source of truth. CLAUDE.md imports it and adds Claude-specific rules.

## Project overview

Real-time synchronized video watching. A host uploads a video file, receivers
join a room by link, and playback (pause/resume/seek/forward/rewind/volume)
stays in sync across all peers.

- **App**: React 19 + React Router v7 (framework mode, SSR, `flatRoutes`)
- **Signaling**: Express + Socket.IO over HTTPS
- **Media**: WebRTC via `simple-peer` (P2P stream + data channel for control
  events)
- **Runtime**: Deno (2.x) — the project runs on Deno, not Node. Node is **not**
  required.
- **Package manager**: Deno's built-in (`deno.json` + `deno.lock` +
  `deno install`). No `package.json`.
- **Styling**: Tailwind CSS 3 + React Compiler (babel plugin)

## Commands (all via `deno task`)

| Command                | What it does                                                                        |
| ---------------------- | ----------------------------------------------------------------------------------- |
| `deno task setuphttps` | Generate self-signed `localhost.key`/`localhost.pem` (run once after clone)         |
| `deno task dev`        | Dev server: HTTPS + React Router + Socket.IO + Vite HMR on `https://localhost:5173` |
| `deno task build`      | Production build via React Router CLI (runs Vite)                                   |
| `deno task start`      | Serve production build (`NODE_ENV=production deno run -A server.js`)                |
| `deno task lint`       | `deno lint`                                                                         |
| `deno task fmt`        | `deno fmt`                                                                          |
| `deno task check`      | `deno check --sloppy-imports app server.js` (typecheck)                             |
| `deno task test`       | `deno test -A --sloppy-imports`                                                     |
| `deno task verify`     | fmt-check + lint + check + test (run before finishing any task)                     |
| `deno install`         | Install/sync npm dependencies into `node_modules` (managed by Deno)                 |

**The build and typecheck pipelines have already been verified to work under
Deno.** Do not reintroduce `package.json`, `yarn.lock`, `.yarnrc.yml`, ESLint,
or `tsc` — Deno replaces all of these.

## Architecture

Feature-based modules with a strict **UI / logic / contract** separation:

```
app/
  common/                 cross-cutting shared code (components, logic, contracts, constants)
    components/           presentational UI (Header, Footer, Popover, TextField, UnifiedButton)
    contracts/            .d.ts namespace contracts (Button, Fields, Popover) + constants.ts
    logic/                hooks & pure logic (useButtonBehaviour, usePopoverBehaviour, generateRoomID)
  context/Session/        global session state (roomId, userName, role)
    components/           SessionContextProvider
    contracts/            Session.d.ts, Role.ts
    logic/                SessionContext
  features/               feature-scoped modules
    toastMessages/        sonner-based toast library + view
    videoPlayback/        video player UI, controls, seeker, volume, share, fullscreen
    webRTC/               simple-peer managers (Base/Host/Reciever PeerManager)
    webSocket/            socket.io managers (Base/Host/Reciever SocketManager)
  routes/                 React Router flat routes
    _index/               home page (name entry + room id inference)
    $id.SetupScreen/      host/join party choice
    $id.file-upload/      host video upload
    $id.HostVideoPlayerNew.tsx      host playback route
    $id.RecieverVideoPlayerNew.tsx  receiver playback route
  utils/                  shared helper contracts (peerRegistry, peerSignal, videoPlayerUtils)
server.js                 Express + HTTPS + Socket.IO + React Router request handler
```

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

Every feature/route/context folder keeps the pattern:

- `components/` — UI only. No business logic. Props come from `types/` or
  `contracts/`.
- `logic/` — business logic: hooks (`useXBehaviour`) and class managers. No JSX.
- `contracts/` — `.d.ts` files using `declare namespace X { ... } export = X`
  for type contracts, plus `constants.ts` for string enums/event names.
- `types/` — small prop/type definitions for components (when not in a
  contract).

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
  `contracts/types.ts`. Do not create `utils.ts`/`types.ts`/`helpers.ts`
  dumping grounds.
- Exception: a tiny private helper used only by one module may live beside it;
  a cohesive enum + its consumer type may share a file only when they are one
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

## Testing

- Deno's built-in test runner (`deno test`). No Jest/Vitest.
- Tests live next to the code: `foo.test.ts` alongside `foo.ts` (both under
  `app/` or `server/`).
- `@std/assert` is the assertion library (import `from "@std/assert"`).
- New logic must include tests. Pure logic (utils, contracts) is easiest to
  test.
- Run the whole suite with `deno task test`.

### Test coverage depth (mandatory)

Every module's tests must cover **all five categories** — not just the happy path:

1. **Happy path** — the intended success flow.
2. **Sad path** — expected failures (validation rejected, not found, permission
   denied, rate-limited, etc.).
3. **Edge cases** — empty/null input, zero values, boundary values, first/last
   items, concurrent/repeated calls.
4. **Mutation cases** — tests that would FAIL if the implementation were
   subtly changed in a way that breaks the contract (e.g. swapping `>`/`>=`,
   dropping a guard, off-by-one, wrong clamp direction, dropping a field from a
   payload). Each critical branch of the code should have a test that pins its
   exact behavior.
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
- `server.js` is the only server entry point — if you need to add socket events,
  add them in `attachSocketIOServer` there, and mirror the event names in the
  client `contracts/constants.ts`.
