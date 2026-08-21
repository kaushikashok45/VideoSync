import { dirname } from "node:path";
import type { FsdPath } from "../../contracts/fsd-path";

/**
 * Same-slice test for the "sibling presentation" and "own contracts" allow
 * entries. `sliceRoot` is compared when `classify()` assigned one to both
 * sides; the legacy zone never gets a `sliceRoot`, so a legacy pair instead
 * falls back to sharing one containing directory -- true siblings only.
 */
function sameSlice(
  source: FsdPath,
  target: FsdPath,
  sourceFile: string,
  targetPath: string,
): boolean {
  if (source.sliceRoot !== null && target.sliceRoot !== null) {
    return source.sliceRoot === target.sliceRoot;
  }
  return dirname(sourceFile) === dirname(targetPath);
}

/**
 * The two same-slice import allowances `no-smart-import` grants: the whole
 * `contracts/` directory (the AST carries no type information, so a runtime
 * value under `contracts/` can't be told apart from a types-only import),
 * and a sibling presentation file in the same slice.
 */
export function presentationImportScope(
  source: FsdPath,
  target: FsdPath,
  sourceFile: string,
  targetPath: string,
): {
  readonly isOwnContracts: boolean;
  readonly isSiblingPresentation: boolean;
} {
  const same = sameSlice(source, target, sourceFile, targetPath);
  return {
    isOwnContracts: target.role === "contracts" && same,
    isSiblingPresentation: target.isPresentation && same,
  };
}
