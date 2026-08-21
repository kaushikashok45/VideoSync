import type { FsdPath } from "../../contracts/fsd-path";

const LOGIC_LIMIT = 2;
const PRESENTATION_LIMIT = 4;

/**
 * Selects the cyclomatic-complexity limit for a file per
 * `docs/CODING_STANDARDS.md` §1: presentation code (and the `tools/**`
 * carve-out, per `docs/GOVERNANCE.md`) gets the looser bound. Both reads are
 * of the single `classify()` record, never an independent path test
 * [why](docs/DECISIONS.md#ad-004).
 */
export function complexityLimit(fsd: FsdPath): number {
  if (fsd.root === "tools") return PRESENTATION_LIMIT;
  return fsd.isPresentation ? PRESENTATION_LIMIT : LOGIC_LIMIT;
}
