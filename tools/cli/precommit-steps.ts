import type { Scope, Step } from "../contracts/precommit";

function scopeFlag(scope: Scope): string {
  return scope === "all" ? "--all" : "--changed";
}

function checkStep(name: string, scope: Scope): Step {
  return { name, command: ["task", name, scopeFlag(scope)] };
}

function scopedTask(name: string, scope: Scope): Step {
  return scope === "all"
    ? { name, command: ["task", name, "--all"] }
    : { name, command: ["task", name] };
}

/**
 * The ordered `deno task precommit` step list: fmt/lint/typecheck, the four
 * structural/boundary/dumb-ui/semantics plugin checks, the ERD doc check,
 * mutation testing, and the coverage floor -- everything `verify` does not
 * already cover, scoped to `--changed` by default (`--all` for CI-style full
 * runs). Deliberately excludes a bare `deno test` step: `mutate` and
 * `coverage:floor` each run the full test suite internally already, so a
 * separate step would duplicate, not add, coverage.
 */
export function buildPrecommitSteps(scope: Scope): readonly Step[] {
  return [
    { name: "fmt", command: ["fmt", "--check"] },
    { name: "lint", command: ["lint"] },
    {
      name: "check",
      command: ["check", "--sloppy-imports", "app", "server"],
    },
    checkStep("check:structural", scope),
    checkStep("check:boundary", scope),
    checkStep("check:dumb-ui", scope),
    checkStep("check:semantics", scope),
    { name: "erd:check", command: ["task", "erd:check"] },
    scopedTask("mutate", scope),
    scopedTask("coverage:floor", scope),
  ];
}
