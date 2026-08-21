import { assertEquals } from "@std/assert";
import { formatMutationReport } from "./mutation-report.ts";

Deno.test("happy: names the affected-test set that ran", () => {
  const report = formatMutationReport([
    {
      file: "app/a.ts",
      generated: 3,
      killed: 2,
      killedByTypes: 1,
      survived: 0,
      harnessError: false,
      testFiles: ["app/a.test.ts"],
    },
  ]);
  assertEquals(
    report,
    "app/a.ts: 3 generated, 2 killed, 1 killed-by-types, 0 survived (tests: app/a.test.ts)",
  );
});

Deno.test("edge: a harness-error file is reported distinctly, with no tally", () => {
  const report = formatMutationReport([
    {
      file: "app/b.ts",
      generated: 0,
      killed: 0,
      killedByTypes: 0,
      survived: 0,
      harnessError: true,
      testFiles: [],
    },
  ]);
  assertEquals(
    report,
    "app/b.ts: harness-error (affected-test set may be incomplete)",
  );
});

Deno.test('sad: an empty test-file set prints "none" rather than blank', () => {
  const report = formatMutationReport([
    {
      file: "app/c.ts",
      generated: 1,
      killed: 0,
      killedByTypes: 0,
      survived: 1,
      harnessError: false,
      testFiles: [],
    },
  ]);
  assertEquals(report.includes("(tests: none)"), true);
});
