import { collectRawViolations } from "./collect-raw-violations.ts";
import { aggregateCounts } from "./aggregate-counts.ts";
import { findIncreases } from "./compare-counts.ts";
import type {
  LoadedFile,
  PersistedBaseline,
  RegenOptions,
  RegenResult,
  ViolationCounts,
} from "../contracts/baseline-generate";

interface RegenerateArgs {
  readonly repoRoot: string;
  readonly files: readonly LoadedFile[];
  readonly paths: readonly string[];
  readonly previous: PersistedBaseline | null;
  readonly options: RegenOptions;
}

const EMPTY_COUNTS: ViolationCounts = {
  violations: {},
  perFile: {},
  perRule: {},
};

function nextLogEntry(options: RegenOptions) {
  return {
    at: new Date().toISOString(),
    allowedIncrease: options.allowIncrease,
    reason: options.reason,
  };
}

function approvedBaseline(
  args: RegenerateArgs,
  counts: ViolationCounts,
): PersistedBaseline {
  const previousLog = args.previous?.log ?? [];
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    paths: args.paths,
    violations: counts.violations,
    perFile: counts.perFile,
    perRule: counts.perRule,
    log: [...previousLog, nextLogEntry(args.options)],
  };
}

/**
 * The pure decision core of `baseline:regen`: scan, aggregate, and either
 * approve the new baseline or refuse with the increases found. No file I/O
 * here, so this is trivially testable
 * [why](docs/GOVERNANCE.md#the-ratchet-baseline-planned-p2).
 */
export function regenerateBaseline(args: RegenerateArgs): RegenResult {
  const raw = collectRawViolations(args.repoRoot, args.files);
  const counts = aggregateCounts(raw);
  const previousCounts = args.previous ?? EMPTY_COUNTS;
  const increases = findIncreases(previousCounts, counts);
  if (increases.length > 0 && !args.options.allowIncrease) {
    return { ok: false, increases };
  }
  return { ok: true, baseline: approvedBaseline(args, counts) };
}
