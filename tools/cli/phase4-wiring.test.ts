import { assertEquals } from "@std/assert";

Deno.test("happy: Phase 4 tasks are wired in deno.json", () => {
  const tasks = JSON.parse(Deno.readTextFileSync("deno.json")).tasks;
  assertEquals(tasks["erd:check"], "deno run -A tools/docs-check/erd-check.ts");
  assertEquals(
    tasks["pipeline:check"],
    "deno run -A tools/docs-check/pipeline-check.ts",
  );
  assertEquals(
    tasks["mutate"],
    "deno test -A --sloppy-imports tools/mutate/run-mutation.harness.ts --",
  );
  assertEquals(tasks["coverage:floor"], "deno run -A tools/coverage/floor.ts");
});
