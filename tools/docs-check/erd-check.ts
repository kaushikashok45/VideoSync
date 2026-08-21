import type {
  EntityCheckResult,
  ErdResult,
  Section,
} from "../contracts/docs-check";
import { parseSections } from "./markdown-sections.ts";
import { listItems } from "./list-items.ts";
import { checkInvariant } from "./invariant-check.ts";
import { entityDirectories } from "./entity-directories.ts";
import { driftFlags } from "./erd-drift.ts";

function entityName(heading: string): string | null {
  return /^Entity:\s+(.+)$/.exec(heading)?.[1] ?? null;
}

function sumInvariants(
  invariants: readonly {
    bound: number;
    pending: number;
    failures: readonly string[];
  }[],
): { bound: number; pending: number; failures: readonly string[] } {
  return {
    bound: invariants.reduce((sum, result) => sum + result.bound, 0),
    pending: invariants.reduce((sum, result) => sum + result.pending, 0),
    failures: invariants.flatMap((result) => result.failures),
  };
}

/**
 * Section-scoped, never grep-scoped (Trap 1): only an `Entity: X` section's
 * own `rawText` is ever inspected, so a marker (e.g. `PENDING`) appearing in
 * this document's own format-contract prose is never in scope.
 *
 * `ERD-CODE DRIFT` is reported via `driftDetails`, never mixed into
 * `failures`: it is a heuristic signal (docs/erd-drift.ts), not a
 * machine-certain defect, so it must never fail the exit code on its own.
 */
function checkNonEmptyEntity(
  entity: string,
  section: Section,
  repoRoot: string,
): EntityCheckResult {
  const invariants = listItems(section.rawText, "**Invariants**");
  if (invariants.length === 0) {
    return {
      bound: 0,
      pending: 0,
      driftDetails: [],
      failures: [`${entity}: entity has zero invariants`],
    };
  }
  const summary = sumInvariants(
    invariants.map((text) => checkInvariant(entity, text, repoRoot)),
  );
  return {
    bound: summary.bound,
    pending: summary.pending,
    driftDetails: driftFlags(entity, section.rawText, repoRoot),
    failures: summary.failures,
  };
}

function checkEntitySection(
  section: Section,
  repoRoot: string,
): EntityCheckResult {
  const entity = entityName(section.heading);
  if (entity === null) {
    return { bound: 0, pending: 0, driftDetails: [], failures: [] };
  }
  return checkNonEmptyEntity(entity, section, repoRoot);
}

function checkDirectoryCoverage(
  markdown: string,
  repoRoot: string,
): readonly string[] {
  return entityDirectories(repoRoot)
    .filter((directory) => !markdown.includes(`\`${directory}\``))
    .map((directory) => `entity directory is absent from ERD.md: ${directory}`);
}

export function checkErdMarkdown(
  markdown: string,
  repoRoot: string,
): ErdResult {
  const sections = parseSections(markdown).map((section) =>
    checkEntitySection(section, repoRoot)
  );
  return {
    bound: sections.reduce((sum, result) => sum + result.bound, 0),
    pending: sections.reduce((sum, result) => sum + result.pending, 0),
    drift: sections.reduce(
      (sum, result) => sum + result.driftDetails.length,
      0,
    ),
    driftDetails: sections.flatMap((result) => result.driftDetails),
    failures: [
      ...sections.flatMap((result) => result.failures),
      ...checkDirectoryCoverage(markdown, repoRoot),
    ],
  };
}

function writeLine(message: string): void {
  Deno.stdout.writeSync(new TextEncoder().encode(`${message}\n`));
}

function runErdCheck(repoRoot = Deno.cwd()): number {
  const result = checkErdMarkdown(
    Deno.readTextFileSync(`${repoRoot}/ERD.md`),
    repoRoot,
  );
  for (const failure of result.failures) writeLine(`ERD: ${failure}`);
  for (const drift of result.driftDetails) writeLine(`DRIFT: ${drift}`);
  writeLine(
    `erd:check: ${result.bound} bound, ${result.pending} pending, ${result.drift} drift`,
  );
  return result.failures.length === 0 ? 0 : 1;
}

if (import.meta.main) Deno.exit(runErdCheck());
