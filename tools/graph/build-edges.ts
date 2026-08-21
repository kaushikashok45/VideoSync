import { classify } from "../lint-plugins/shared/fsd-path.ts";
import { collectSpecifierSites } from "./specifier-sites.ts";
import { sliceKeyOf } from "./slice-key.ts";
import type { ImportEdge } from "../contracts/import-edge";

interface Resolver {
  resolve(raw: string, fromFile: string): { absolutePath: string | null };
}

interface ResolvedFile {
  readonly absolutePath: string;
  readonly source: string;
}

function repoRelative(absolutePath: string, repoRoot: string): string {
  return absolutePath.startsWith(repoRoot)
    ? absolutePath.slice(repoRoot.length + 1)
    : absolutePath;
}

function edgeFor(
  repoRoot: string,
  file: ResolvedFile,
  targetAbsolutePath: string,
): ImportEdge {
  return {
    from: repoRelative(file.absolutePath, repoRoot),
    to: repoRelative(targetAbsolutePath, repoRoot),
    fromSlice: sliceKeyOf(classify(file.absolutePath)),
    toSlice: sliceKeyOf(classify(targetAbsolutePath)),
  };
}

function edgesForFile(
  repoRoot: string,
  resolver: Resolver,
  file: ResolvedFile,
): readonly ImportEdge[] {
  const edges: ImportEdge[] = [];
  for (const raw of collectSpecifierSites(file.absolutePath, file.source)) {
    const resolved = resolver.resolve(raw, file.absolutePath);
    if (resolved.absolutePath === null) continue;
    edges.push(edgeFor(repoRoot, file, resolved.absolutePath));
  }
  return edges;
}

/**
 * Every raw import edge across `files`, resolved via the same
 * `specifier-resolve.ts` the boundary checker uses -- never a second,
 * independent path resolver -- so the graph and the boundary checker can
 * never disagree about what a specifier points at.
 */
export function buildEdges(
  repoRoot: string,
  resolver: Resolver,
  files: readonly ResolvedFile[],
): readonly ImportEdge[] {
  const edges: ImportEdge[] = [];
  for (const file of files) {
    edges.push(...edgesForFile(repoRoot, resolver, file));
  }
  return edges;
}
