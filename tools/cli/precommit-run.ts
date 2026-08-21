import type { Step, StepRunner, StepsResult } from "../contracts/precommit";

/**
 * Runs `steps` in order via `runStep`, stopping at the first failure --
 * fail-fast, since a later step's output is meaningless once an earlier one
 * is already red, and this is what a human reads when blocked. Pure over an
 * injected runner so the sequencing logic is testable without spawning real
 * `deno` subprocesses.
 */
export function evaluatePrecommitSteps(
  steps: readonly Step[],
  runStep: StepRunner,
): StepsResult {
  for (const step of steps) {
    const outcome = runStep(step);
    if (!outcome.ok) {
      return { ok: false, failedStep: step.name, output: outcome.output };
    }
  }
  return { ok: true, failedStep: null, output: "" };
}
