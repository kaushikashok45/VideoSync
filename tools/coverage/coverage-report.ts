import type { LcovRecord } from "../contracts/docs-check";

function percentage(hit: number, found: number): number {
  return found === 0 ? 100 : (hit / found) * 100;
}

function fileLine(record: LcovRecord): string {
  const line = percentage(record.linesHit, record.linesFound);
  const branch = percentage(record.branchesHit, record.branchesFound);
  return `${record.file}: lines ${line.toFixed(1)}%, branches ${
    branch.toFixed(1)
  }%`;
}

function isUnderFloor(record: LcovRecord, floor: number): boolean {
  const line = percentage(record.linesHit, record.linesFound);
  const branch = percentage(record.branchesHit, record.branchesFound);
  return Math.min(line, branch) < floor;
}

function totals(
  records: readonly LcovRecord[],
): { hit: number; found: number } {
  return records.reduce(
    (total, record) => ({
      hit: total.hit + record.linesHit + record.branchesHit,
      found: total.found + record.linesFound + record.branchesFound,
    }),
    { hit: 0, found: 0 },
  );
}

/**
 * Formats one line per file plus an aggregate line -- own arithmetic on
 * `LF/LH`+`BRF/BRH`, since `deno coverage --threshold` is repo-wide only --
 * and reports whether any in-scope file fell under `floor`.
 */
export function coverageReport(
  records: readonly LcovRecord[],
  floor: number,
): { readonly lines: readonly string[]; readonly failed: boolean } {
  const { hit, found } = totals(records);
  return {
    lines: [
      ...records.map(fileLine),
      `coverage:floor: ${percentage(hit, found).toFixed(1)}% (floor ${floor}%)`,
    ],
    failed: records.some((record) => isUnderFloor(record, floor)),
  };
}
