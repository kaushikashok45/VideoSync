import type { Step, StepOutcome } from "../contracts/precommit";
import { buildPrecommitSteps } from "./precommit-steps.ts";
import { evaluatePrecommitSteps } from "./precommit-run.ts";

function parseScope(args: readonly string[]): "changed" | "all" {
  return args.includes("--all") ? "all" : "changed";
}

function spawnStep(step: Step, repoRoot: string): StepOutcome {
  const result = new Deno.Command("deno", {
    args: [...step.command],
    cwd: repoRoot,
    stdout: "piped",
    stderr: "piped",
  }).outputSync();
  const decoder = new TextDecoder();
  return {
    ok: result.success,
    output: decoder.decode(result.stdout) + decoder.decode(result.stderr),
  };
}

/**
 * `deno task precommit`'s entrypoint. `--changed` (via `governed-diff.ts`'s
 * file list, consumed inside each step) by default, `--all` for CI-style
 * full runs. `--machine-only` is accepted for CLI compatibility with
 * `/review-now`'s `deno task precommit --machine-only` gate check -- this
 * module never writes a receipt (that happens only in `/review-now`), so the
 * flag changes nothing about which steps run.
 */
export function runPrecommit(
  args: readonly string[],
  repoRoot: string,
): number {
  const steps = buildPrecommitSteps(parseScope(args));
  const result = evaluatePrecommitSteps(
    steps,
    (step) => spawnStep(step, repoRoot),
  );
  if (!result.ok) {
    console.error(`precommit: step "${result.failedStep}" failed`);
    console.error(result.output);
    return 1;
  }
  return 0;
}

const REPO_ROOT = new URL("../../", import.meta.url).pathname.replace(
  /\/$/,
  "",
);

if (import.meta.main) {
  Deno.exit(runPrecommit(Deno.args, REPO_ROOT));
}
