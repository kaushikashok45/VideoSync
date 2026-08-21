import type { InvariantResult } from "../contracts/docs-check";
import { parseProvenBy } from "./proven-by.ts";

function invariantId(entity: string, invariantText: string): string {
  return /^`([^`]+)`/.exec(invariantText)?.[1] ?? `${entity}-INV-?`;
}

function testLiteral(source: string, name: string): boolean {
  return source.includes(`Deno.test("${name}"`);
}

function fileExists(path: string): boolean {
  try {
    return Deno.statSync(path).isFile;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false;
    throw error;
  }
}

function checkBoundProof(
  id: string,
  file: string,
  tests: readonly string[],
  repoRoot: string,
): InvariantResult {
  const fullPath = `${repoRoot}/${file}`;
  if (!fileExists(fullPath)) {
    return {
      bound: tests.length,
      pending: 0,
      failures: [`${id}: missing proof file ${file}`],
    };
  }
  const source = Deno.readTextFileSync(fullPath);
  const failures = tests
    .filter((test) => !testLiteral(source, test))
    .map((test) => `${id}: missing literal test "${test}" in ${file}`);
  return { bound: tests.length, pending: 0, failures };
}

/**
 * Resolves one wrap-joined invariant list item to a `bound` / `pending` /
 * `failures` result. Fails loudly (never silently passes) when `Proven by:`
 * is malformed — a checker that cannot see a literal test name must not
 * report success.
 */
export function checkInvariant(
  entity: string,
  invariantText: string,
  repoRoot: string,
): InvariantResult {
  const id = invariantId(entity, invariantText);
  const proof = parseProvenBy(invariantText);
  if (proof.kind === "pending") return { bound: 0, pending: 1, failures: [] };
  if (proof.kind === "malformed") {
    return {
      bound: 0,
      pending: 0,
      failures: [`${id}: non-literal or malformed Proven by: ${proof.raw}`],
    };
  }
  return checkBoundProof(id, proof.file, proof.tests, repoRoot);
}
