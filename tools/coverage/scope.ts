import type { FsdPath } from "../contracts/fsd-path";

/**
 * The coverage floor's stated scope: `model/`, `api/`, `lib/`, and entity
 * code. Presentation is excluded by a separate check
 * (`fsd.isPresentation`) -- this predicate only decides whether a file is
 * in-scope *at all*, so a changed `contracts/*.d.ts`, a `tools/**` script,
 * or a bare `ui/` helper never counts toward the floor even though none of
 * them are presentation either.
 */
export function isFloorScoped(fsd: FsdPath): boolean {
  if (fsd.layerName === "entities") return true;
  return fsd.role === "model" || fsd.role === "api" || fsd.role === "lib";
}
