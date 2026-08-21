import { classify } from "./fsd-path.ts";
import type { FsdPath } from "../../contracts/fsd-path";

interface Resolver {
  resolve(raw: string, fromFile: string): { absolutePath: string | null };
}

/**
 * Resolves one import specifier to the classification of what it points at.
 * `null` covers bare specifiers and anything `specifier-resolve.ts` could not
 * resolve on disk -- neither is a boundary concern (D-004: never re-derive
 * path semantics, always go through `classify()`).
 */
export function resolveImportTarget(
  raw: string,
  fromFile: string,
  resolver: Resolver,
): FsdPath | null {
  const resolved = resolver.resolve(raw, fromFile);
  return resolved.absolutePath === null
    ? null
    : classify(resolved.absolutePath);
}
