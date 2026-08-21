import type { GrandfatheredTerm, Ontology } from "../contracts/docs-check";
import { parseSections } from "./markdown-sections.ts";
import { tableRows } from "./markdown-tables.ts";

function backtickTerms(cell: string): readonly string[] {
  return [...cell.matchAll(/`([^`]+)`/g)].map((match) => match[1]);
}

function boldTerm(cell: string): string | null {
  return /\*\*([^*]+)\*\*/.exec(cell)?.[1] ?? null;
}

function sectionText(markdown: string, headingPattern: RegExp): string {
  return parseSections(markdown).find((section) =>
    headingPattern.test(section.heading)
  )?.rawText ?? "";
}

function canonicalBannedTerms(markdown: string): readonly string[] {
  const rows = tableRows(
    sectionText(markdown, /^Canonical terms and banned synonyms$/),
  );
  return rows.flatMap((row) => backtickTerms(row[2] ?? ""));
}

function distinctTerms(markdown: string): readonly string[] {
  const rows = tableRows(
    sectionText(markdown, /^Distinct terms that only look like synonyms$/),
  );
  return rows.flatMap((row) => {
    const term = boldTerm(row[0] ?? "");
    return term === null ? [] : [term];
  });
}

function isScannableTerm(term: string | undefined): term is string {
  if (term === undefined) return false;
  return !term.includes("/") && !term.includes(".");
}

/**
 * Only rows whose first backtick span is a plain term (not a file path) are
 * scannable occurrence-count ratchets. `docs/PRODUCT-MODEL.md`'s third
 * grandfathered row names a frozen legacy *file*
 * (`app/features/{webRTC,webSocket}/contracts/constants.ts`), which is a
 * structural fact, not a countable word — a different kind of check this
 * module does not attempt.
 */
function grandfatheredTerms(markdown: string): readonly GrandfatheredTerm[] {
  const rows = tableRows(sectionText(markdown, /^Grandfathered/));
  return rows.flatMap((row) => {
    const term = backtickTerms(row[0] ?? "")[0];
    if (!isScannableTerm(term)) return [];
    return [{ term, evidenceText: row[1] ?? "" }];
  });
}

/**
 * Reads every term list this checker needs directly out of
 * `docs/PRODUCT-MODEL.md`'s "Terminology ontology" tables — nothing is
 * hardcoded, so the checker cannot drift from the document it enforces.
 */
export function parseOntology(markdown: string): Ontology {
  return {
    canonicalBanned: canonicalBannedTerms(markdown),
    distinctTerms: distinctTerms(markdown),
    grandfathered: grandfatheredTerms(markdown),
  };
}
