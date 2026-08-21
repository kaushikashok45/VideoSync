import type { SliceEdge } from "../contracts/slice-edge";

/**
 * How many distinct other slices each slice imports, from the deduplicated
 * cross-slice graph. `slice-fan-out-cap`'s sibling: the count is
 * cross-file knowledge a single-file AST pass cannot see, so it is computed
 * here, once, from `edges.jsonl`, and the rule only looks its own slice up.
 */
export function fanOutCounts(
  edges: readonly SliceEdge[],
): ReadonlyMap<string, number> {
  const targets = new Map<string, Set<string>>();
  for (const edge of edges) {
    const set = targets.get(edge.from) ?? new Set<string>();
    set.add(edge.to);
    targets.set(edge.from, set);
  }
  const counts = new Map<string, number>();
  for (const [slice, set] of targets) counts.set(slice, set.size);
  return counts;
}
