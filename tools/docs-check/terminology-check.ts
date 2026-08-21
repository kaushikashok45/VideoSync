import type { Ontology, TerminologyBaseline } from "../contracts/docs-check";
import { parseOntology } from "./terminology-ontology.ts";
import { scanForTerms } from "./terminology-scan.ts";

function isDistinct(ontology: Ontology, term: string): boolean {
  return ontology.distinctTerms.some((distinct) =>
    distinct.toLowerCase() === term.toLowerCase()
  );
}

/**
 * Canonical banned synonyms minus the ontology's own "distinct terms that
 * only look like synonyms" table — this is the whole fix for `session` never
 * being flagged as a synonym of `room`, nor `peer` of `member`: both are
 * protected in that table, so they are removed here regardless of also
 * appearing in the banned-synonyms column.
 */
function effectiveBannedTerms(ontology: Ontology): readonly string[] {
  return ontology.canonicalBanned.filter((term) => !isDistinct(ontology, term));
}

function ratchetFailures(
  counts: readonly { term: string; totalCount: number }[],
  baseline: TerminologyBaseline,
): readonly string[] {
  return counts.flatMap((count) => {
    const allowed = baseline[count.term.toLowerCase()] ?? 0;
    return count.totalCount > allowed
      ? [
        `${count.term}: ${count.totalCount} occurrences exceeds the ratcheted ceiling of ${allowed}`,
      ]
      : [];
  });
}

/**
 * Enforces `docs/PRODUCT-MODEL.md`'s terminology ontology: every banned
 * synonym (minus protected distinct terms) and every grandfathered term is
 * scanned, and a term's live occurrence count may never exceed its ratchet
 * `baseline` — the same "existing violations never increase" mechanism the
 * structural lint ratchet uses, so registering this checker cannot turn an
 * already-green tree red.
 */
export function checkTerminology(
  productModel: string,
  repoRoot: string,
  baseline: TerminologyBaseline,
): readonly string[] {
  const ontology = parseOntology(productModel);
  const terms = [
    ...effectiveBannedTerms(ontology),
    ...ontology.grandfathered.map((entry) => entry.term),
  ];
  return ratchetFailures(scanForTerms(repoRoot, terms), baseline);
}

function loadBaseline(repoRoot: string): TerminologyBaseline {
  return JSON.parse(
    Deno.readTextFileSync(
      `${repoRoot}/tools/docs-check/terminology-baseline.json`,
    ),
  );
}

function writeLine(message: string): void {
  Deno.stdout.writeSync(new TextEncoder().encode(`${message}\n`));
}

function runTerminologyCheck(repoRoot = Deno.cwd()): number {
  const productModel = Deno.readTextFileSync(
    `${repoRoot}/docs/PRODUCT-MODEL.md`,
  );
  const failures = checkTerminology(
    productModel,
    repoRoot,
    loadBaseline(repoRoot),
  );
  for (const failure of failures) writeLine(`TERMINOLOGY: ${failure}`);
  writeLine(`terminology:check: ${failures.length} ratchet violation(s)`);
  return failures.length === 0 ? 0 : 1;
}

if (import.meta.main) Deno.exit(runTerminologyCheck());
