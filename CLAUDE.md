# CLAUDE.md — Claude-specific rules for VideoSync

This file extends [AGENTS.md](./AGENTS.md), which is the single source of truth
for project governance, architecture, conventions, commands, and guardrails.
Read AGENTS.md first.

```markdown
@import ./AGENTS.md
```

## Claude-specific rules

- **Before any code change**, read the relevant module's
  `components/`/`logic/`/`contracts/` split so your change follows the UI/logic
  separation already established.
- **Never hand-optimize** with `useMemo`/`useCallback`/`React.memo` — React
  Compiler is enabled; memoization is automatic. If a component is genuinely
  hot, say so and measure first.
- **Deno-native, not Node-native**: prefer `deno task ...`, `node:`-prefixed
  built-ins, `@std/assert` in tests. Reject any suggestion to add
  `package.json`, `tsc`, ESLint, Jest, or Vitest.
- **Type contracts live in `contracts/` `.d.ts` files** using
  `declare namespace X { ... } export = X`. Keep new shared shapes there rather
  than inline in components.
- **Tests**: when you add or change logic, add or update `*.test.ts` next to the
  file and run `deno task test` (or `deno task verify`) before declaring the
  work done.
- **Claude-specific check**: run `deno task verify` (fmt + lint + check + test)
  and the production build (`deno task build`) before finishing. Paste the final
  output as evidence.
- If you fix a type/lint issue, note whether Deno's `deno check`/`deno lint`
  caught something `tsc`/ESLint missed — the Deno toolchain is the source of
  truth.
