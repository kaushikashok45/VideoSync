import { assertEquals } from "@std/assert";
import { aggregateCounts } from "./aggregate-counts.ts";
import type { RawViolation } from "../contracts/baseline-generate";

function violation(
  path: string,
  identity: string,
  ruleId: string,
): RawViolation {
  return { path, identity, ruleId };
}

Deno.test("happy: two violations in the same file with different identities count separately", () => {
  const counts = aggregateCounts([
    violation("a.ts", "id-1", "structural/complexity"),
    violation("a.ts", "id-2", "structural/complexity"),
  ]);
  assertEquals(counts.violations, { "id-1": 1, "id-2": 1 });
  assertEquals(counts.perFile, { "a.ts": 2 });
  assertEquals(counts.perRule, { "structural/complexity": 2 });
});

Deno.test("sad: the same identity repeated across files accumulates a single count", () => {
  const counts = aggregateCounts([
    violation("a.ts", "id-1", "boundary/layer-order"),
    violation("b.ts", "id-1", "boundary/layer-order"),
  ]);
  assertEquals(counts.violations, { "id-1": 2 });
  assertEquals(counts.perFile, { "a.ts": 1, "b.ts": 1 });
});

Deno.test("edge: an empty input produces empty maps, not a crash", () => {
  const counts = aggregateCounts([]);
  assertEquals(counts.violations, {});
  assertEquals(counts.perFile, {});
  assertEquals(counts.perRule, {});
});

Deno.test("edge: two different rules on the same file count per-rule independently", () => {
  const counts = aggregateCounts([
    violation("a.ts", "id-1", "semantics/no-console"),
    violation("a.ts", "id-2", "structural/complexity"),
  ]);
  assertEquals(counts.perRule, {
    "semantics/no-console": 1,
    "structural/complexity": 1,
  });
});
