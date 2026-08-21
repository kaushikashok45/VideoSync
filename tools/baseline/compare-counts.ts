import type {
  CountIncrease,
  ViolationCounts,
} from "../contracts/baseline-generate";

function increasesIn(
  kind: CountIncrease["kind"],
  previous: Readonly<Record<string, number>>,
  current: Readonly<Record<string, number>>,
): readonly CountIncrease[] {
  const found: CountIncrease[] = [];
  for (const key of Object.keys(previous)) {
    const before = previous[key];
    const after = current[key] ?? 0;
    if (after > before) {
      found.push({ kind, key, previous: before, current: after });
    }
  }
  return found;
}

/**
 * The frozen-budget check (docs/GOVERNANCE.md, "ratchet baseline"): an
 * existing identity/file/rule's count may only decrease, never increase.
 * Only keys already present in `previous` are checked -- a brand-new
 * identity, file, or rule has no prior count to have frozen; new-path zero
 * tolerance is the suppressor's job at lint time, not this refusal's.
 */
export function findIncreases(
  previous: ViolationCounts,
  current: ViolationCounts,
): readonly CountIncrease[] {
  return [
    ...increasesIn("identity", previous.violations, current.violations),
    ...increasesIn("file", previous.perFile, current.perFile),
    ...increasesIn("rule", previous.perRule, current.perRule),
  ];
}
