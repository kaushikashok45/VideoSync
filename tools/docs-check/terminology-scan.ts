import type { TermCount } from "../contracts/docs-check";

const SCAN_ROOTS = ["app", "server", "shared"];

function filesUnder(root: string): readonly string[] {
  return [...Deno.readDirSync(root)].flatMap((entry) => {
    const path = `${root}/${entry.name}`;
    if (entry.isDirectory) return filesUnder(path);
    return entry.isFile ? [path] : [];
  });
}

function isScannable(path: string): boolean {
  const isSource = path.endsWith(".ts") || path.endsWith(".tsx");
  const isTest = path.endsWith(".test.ts") || path.endsWith(".test.tsx");
  return isSource && !isTest;
}

function scannableFiles(repoRoot: string): readonly string[] {
  return SCAN_ROOTS.flatMap((root) => {
    try {
      return filesUnder(`${repoRoot}/${root}`).filter(isScannable);
    } catch (error) {
      if (error instanceof Deno.errors.NotFound) return [];
      throw error;
    }
  });
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * A trailing `*` (e.g. `Reciever*`, as `docs/PRODUCT-MODEL.md` writes it)
 * means "starts with" rather than an exact word — the misspelling is
 * frozen as a prefix across `Reciever*Manager`, `RecieverVideoPlayerNew`,
 * etc., not as one exact identifier.
 */
function boundaryPattern(term: string): RegExp {
  const isPrefix = term.endsWith("*");
  const stem = escapeRegExp(isPrefix ? term.slice(0, -1) : term);
  const rightBoundary = isPrefix ? "" : "(?![A-Za-z0-9_-])";
  return new RegExp(`(?<![A-Za-z0-9_-])${stem}${rightBoundary}`, "gi");
}

function boundaryMatchCount(source: string, term: string): number {
  return [...source.matchAll(boundaryPattern(term))].length;
}

function countForTerm(files: readonly string[], term: string): TermCount {
  const hits = files
    .map((file) => ({
      file,
      count: boundaryMatchCount(Deno.readTextFileSync(file), term),
    }))
    .filter((hit) => hit.count > 0);
  return {
    term,
    totalCount: hits.reduce((sum, hit) => sum + hit.count, 0),
    files: hits.map((hit) => hit.file),
  };
}

/**
 * Case-insensitive, word-boundary-aware occurrence count of each of `terms`
 * across every non-test `.ts`/`.tsx` file under `app/`, `server/`, and
 * `shared/`. This is a source-text scan, not an AST walk: it cannot yet
 * distinguish a banned word inside a user-facing string literal from the
 * same word used as a code identifier (docs/GOVERNANCE.md marks that
 * distinction `[planned:P2]`), so both count toward the same ratchet.
 */
export function scanForTerms(
  repoRoot: string,
  terms: readonly string[],
): readonly TermCount[] {
  const files = scannableFiles(repoRoot);
  return terms.map((term) => countForTerm(files, term));
}
