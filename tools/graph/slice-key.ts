import type { FsdPath } from "../contracts/fsd-path";

/**
 * The graph's node identity for a classified path: `root/layerName/slice`,
 * or `null` when the path has no slice (e.g. `shared/**`, `app/app/**`).
 * Shared by the edge builder (from a resolved import's `FsdPath`) and the
 * `slice-fan-out-cap` rule (from the file currently being linted), so the
 * two never key the same slice two different ways.
 */
export function sliceKeyOf(fsd: FsdPath): string | null {
  return fsd.slice === null
    ? null
    : `${fsd.root}/${fsd.layerName}/${fsd.slice}`;
}
