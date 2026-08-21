import { assert, assertEquals, assertNotEquals } from "@std/assert";
import { parse } from "jsr:@std/yaml@^1.0.0";

const CI_PATH = new URL(
  "../../.github/workflows/ci.yml",
  import.meta.url,
).pathname;

interface Step {
  readonly run?: string;
  readonly uses?: string;
}

interface Job {
  readonly steps: readonly Step[];
}

interface Workflow {
  readonly jobs: Record<string, Job>;
}

function isWorkflow(value: unknown): value is Workflow {
  return typeof value === "object" && value !== null && "jobs" in value;
}

function loadWorkflow(): Workflow {
  const parsed: unknown = parse(Deno.readTextFileSync(CI_PATH));
  if (!isWorkflow(parsed)) {
    throw new Error("ci.yml did not parse to a workflow shape");
  }
  return parsed;
}

function allRunCommands(workflow: Workflow): readonly string[] {
  return Object.values(workflow.jobs)
    .flatMap((job) => job.steps)
    .map((step) => step.run)
    .filter((run): run is string => typeof run === "string");
}

Deno.test("happy: ci.yml parses as valid YAML with at least one job", () => {
  const workflow = loadWorkflow();
  assert(Object.keys(workflow.jobs).length > 0);
});

Deno.test("happy: ci.yml calls deno task verify, mutate:ci, and build", () => {
  const commands = allRunCommands(loadWorkflow());
  assert(commands.some((run) => run.includes("deno task verify")));
  assert(commands.some((run) => run.includes("deno task mutate:ci")));
  assert(commands.some((run) => run.includes("deno task build")));
});

Deno.test("sad: ci.yml never references server.js", () => {
  const raw = Deno.readTextFileSync(CI_PATH);
  assertEquals(raw.includes("server.js"), false);
});

Deno.test("edge: ci.yml no longer hand-rolls a parallel fmt/lint/check/test list", () => {
  const commands = allRunCommands(loadWorkflow());
  const handRolled = commands.filter((run) =>
    /deno (fmt --check|lint|check |test )/.test(run)
  );
  assertEquals(handRolled, []);
});

Deno.test("logical-limits: every run command differs from the empty string", () => {
  const commands = allRunCommands(loadWorkflow());
  for (const run of commands) {
    assertNotEquals(run.trim(), "");
  }
});
