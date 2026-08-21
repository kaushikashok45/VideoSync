import { assertEquals } from "@std/assert";
import { coverageReport } from "./coverage-report.ts";

function record(
  overrides: Partial<{
    file: string;
    linesFound: number;
    linesHit: number;
    branchesFound: number;
    branchesHit: number;
  }>,
) {
  return {
    file: "app/a.ts",
    linesFound: 10,
    linesHit: 10,
    branchesFound: 4,
    branchesHit: 4,
    ...overrides,
  };
}

Deno.test("happy: a fully-covered file passes and reports 100%", () => {
  const { lines, failed } = coverageReport([record({})], 80);
  assertEquals(failed, false);
  assertEquals(lines[0], "app/a.ts: lines 100.0%, branches 100.0%");
  assertEquals(lines[1], "coverage:floor: 100.0% (floor 80%)");
});

Deno.test("edge: branch coverage below floor fails even with full line coverage", () => {
  const { failed, lines } = coverageReport(
    [record({ branchesFound: 4, branchesHit: 1 })],
    80,
  );
  assertEquals(failed, true);
  assertEquals(lines[0], "app/a.ts: lines 100.0%, branches 25.0%");
});

Deno.test("sad: a record with no lines/branches found reports 100% (nothing to miss)", () => {
  const { failed } = coverageReport(
    [record({ linesFound: 0, linesHit: 0, branchesFound: 0, branchesHit: 0 })],
    80,
  );
  assertEquals(failed, false);
});

Deno.test("logical-limits: the aggregate combines every file's lines and branches", () => {
  const { lines } = coverageReport(
    [
      record({
        file: "app/a.ts",
        linesFound: 10,
        linesHit: 10,
        branchesFound: 0,
        branchesHit: 0,
      }),
      record({
        file: "app/b.ts",
        linesFound: 10,
        linesHit: 0,
        branchesFound: 0,
        branchesHit: 0,
      }),
    ],
    80,
  );
  assertEquals(lines[2], "coverage:floor: 50.0% (floor 80%)");
});
