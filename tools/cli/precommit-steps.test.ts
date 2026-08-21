import { assert, assertEquals } from "@std/assert";
import { buildPrecommitSteps } from "./precommit-steps.ts";

Deno.test("happy: changed scope passes --changed to the four plugin checks", () => {
  const steps = buildPrecommitSteps("changed");
  for (const name of ["structural", "boundary", "dumb-ui", "semantics"]) {
    const step = steps.find((step) => step.name === `check:${name}`);
    assertEquals(step?.command, ["task", `check:${name}`, "--changed"]);
  }
});

Deno.test("happy: all scope passes --all to the four plugin checks", () => {
  const steps = buildPrecommitSteps("all");
  for (const name of ["structural", "boundary", "dumb-ui", "semantics"]) {
    const step = steps.find((step) => step.name === `check:${name}`);
    assertEquals(step?.command, ["task", `check:${name}`, "--all"]);
  }
});

Deno.test("happy: mutate and coverage:floor omit --changed (their own default) but forward --all", () => {
  const changed = buildPrecommitSteps("changed");
  assertEquals(
    changed.find((step) => step.name === "mutate")?.command,
    ["task", "mutate"],
  );
  assertEquals(
    changed.find((step) => step.name === "coverage:floor")?.command,
    ["task", "coverage:floor"],
  );
  const all = buildPrecommitSteps("all");
  assertEquals(
    all.find((step) => step.name === "mutate")?.command,
    ["task", "mutate", "--all"],
  );
  assertEquals(
    all.find((step) => step.name === "coverage:floor")?.command,
    ["task", "coverage:floor", "--all"],
  );
});

Deno.test("edge: does not duplicate verify's job with a bare deno test step", () => {
  const steps = buildPrecommitSteps("changed");
  assert(!steps.some((step) => step.command.includes("test")));
});

Deno.test("logical-limits: fmt/lint/check run unscoped, matching verify's own invocation", () => {
  const steps = buildPrecommitSteps("changed");
  assertEquals(
    steps.find((step) => step.name === "fmt")?.command,
    ["fmt", "--check"],
  );
  assertEquals(steps.find((step) => step.name === "lint")?.command, ["lint"]);
  assertEquals(
    steps.find((step) => step.name === "check")?.command,
    ["check", "--sloppy-imports", "app", "server"],
  );
});
