import { assertEquals } from "@std/assert";
import { findIncreases } from "./compare-counts.ts";
import type { ViolationCounts } from "../contracts/baseline-generate";

function counts(
  violations: Record<string, number>,
  perFile: Record<string, number> = {},
  perRule: Record<string, number> = {},
): ViolationCounts {
  return { violations, perFile, perRule };
}

Deno.test("happy: an unchanged count produces no increases", () => {
  const previous = counts({ "id-1": 2 });
  const current = counts({ "id-1": 2 });
  assertEquals(findIncreases(previous, current), []);
});

Deno.test("sad: an identity count going up is reported as an increase", () => {
  const previous = counts({ "id-1": 2 });
  const current = counts({ "id-1": 3 });
  assertEquals(findIncreases(previous, current), [
    { kind: "identity", key: "id-1", previous: 2, current: 3 },
  ]);
});

Deno.test("happy: an identity count going down is not an increase", () => {
  const previous = counts({ "id-1": 3 });
  const current = counts({ "id-1": 1 });
  assertEquals(findIncreases(previous, current), []);
});

Deno.test("edge: an identity dropping out entirely (count 0) is not an increase", () => {
  const previous = counts({ "id-1": 3 });
  const current = counts({});
  assertEquals(findIncreases(previous, current), []);
});

Deno.test("edge: a brand-new identity absent from the previous baseline is not an increase", () => {
  const previous = counts({});
  const current = counts({ "id-new": 5 });
  assertEquals(findIncreases(previous, current), []);
});

Deno.test("logical-limits: increases across all three kinds are all reported together", () => {
  const previous: ViolationCounts = {
    violations: { "id-1": 1 },
    perFile: { "a.ts": 1 },
    perRule: { "structural/complexity": 1 },
  };
  const current: ViolationCounts = {
    violations: { "id-1": 2 },
    perFile: { "a.ts": 2 },
    perRule: { "structural/complexity": 2 },
  };
  const increases = findIncreases(previous, current);
  assertEquals(increases.length, 3);
  assertEquals(
    new Set(increases.map((increase) => increase.kind)),
    new Set([
      "identity",
      "file",
      "rule",
    ]),
  );
});
