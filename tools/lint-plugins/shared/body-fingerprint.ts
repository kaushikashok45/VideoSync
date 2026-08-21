import { createHash } from "node:crypto";

const MAX_STATEMENTS = 3;

interface RangedNode {
  readonly range: readonly [number, number];
}

/**
 * Hashes the source text of the first (up to 3) non-blank statements of a
 * function or file body. Line numbers are never inputs -- moving a violation
 * down the file must not change its fingerprint [why](docs/DECISIONS.md#ad-005).
 */
export function fingerprintStatements(
  statements: readonly RangedNode[],
  sourceText: string,
): string {
  const nonBlank = statements
    .map((statement) =>
      sourceText.slice(statement.range[0], statement.range[1]).trim()
    )
    .filter((text) => text.length > 0);
  const payload = nonBlank.slice(0, MAX_STATEMENTS).join("\n");
  return createHash("sha256").update(payload).digest("hex");
}
