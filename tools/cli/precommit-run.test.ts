import { assertEquals } from "@std/assert";
import { evaluatePrecommitSteps } from "./precommit-run.ts";
import type { Step, StepOutcome } from "../contracts/precommit";

const OK: StepOutcome = { ok: true, output: "" };
const FAIL: StepOutcome = { ok: false, output: "boom" };

function stepsNamed(...names: string[]): readonly Step[] {
  return names.map((name) => ({ name, command: [name] }));
}

Deno.test("happy: every step passing yields ok with no failed step", () => {
  const result = evaluatePrecommitSteps(
    stepsNamed("a", "b", "c"),
    () => OK,
  );
  assertEquals(result, { ok: true, failedStep: null, output: "" });
});

Deno.test("sad: the first failing step stops the run and is named", () => {
  const calls: string[] = [];
  const outcomes: Record<string, StepOutcome> = { a: OK, b: FAIL, c: OK };
  const result = evaluatePrecommitSteps(
    stepsNamed("a", "b", "c"),
    (step) => {
      calls.push(step.name);
      return outcomes[step.name];
    },
  );
  assertEquals(result.ok, false);
  assertEquals(result.failedStep, "b");
  assertEquals(result.output, "boom");
  assertEquals(calls, ["a", "b"]);
});

Deno.test("edge: an empty step list is trivially ok", () => {
  const result = evaluatePrecommitSteps([], () => FAIL);
  assertEquals(result, { ok: true, failedStep: null, output: "" });
});

Deno.test("logical-limits: a single failing step reports itself, not a later one", () => {
  const result = evaluatePrecommitSteps(
    stepsNamed("only"),
    () => FAIL,
  );
  assertEquals(result.failedStep, "only");
});
