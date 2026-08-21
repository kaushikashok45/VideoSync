import type {
  RawViolation,
  ViolationCounts,
} from "../contracts/baseline-generate";

function increment(map: Record<string, number>, key: string): void {
  map[key] = (map[key] ?? 0) + 1;
}

/** Reduces a raw violation list into the three count views the ratchet compares against. */
export function aggregateCounts(
  raw: readonly RawViolation[],
): ViolationCounts {
  const violations: Record<string, number> = {};
  const perFile: Record<string, number> = {};
  const perRule: Record<string, number> = {};
  for (const entry of raw) {
    increment(violations, entry.identity);
    increment(perFile, entry.path);
    increment(perRule, entry.ruleId);
  }
  return { violations, perFile, perRule };
}
