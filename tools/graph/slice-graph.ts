import type { ImportEdge } from "../contracts/import-edge";
import type { SliceEdge } from "../contracts/slice-edge";

function keyOf(edge: SliceEdge): string {
  return `${edge.from} ${edge.to}`;
}

/** `null` for a same-slice edge or one with no slice on either end -- neither carries cross-slice information. */
function toSliceEdge(edge: ImportEdge): SliceEdge | null {
  if (edge.fromSlice === null || edge.toSlice === null) return null;
  if (edge.fromSlice === edge.toSlice) return null;
  return { from: edge.fromSlice, to: edge.toSlice };
}

/**
 * Collapses file-level `ImportEdge`s down to the deduplicated, cross-slice
 * graph every graph-derived check reasons over: `cycles.ts`'s SCC search
 * and `slice-fan-out-cap`'s per-slice target count.
 */
export function sliceEdgesFrom(
  edges: readonly ImportEdge[],
): readonly SliceEdge[] {
  const seen = new Map<string, SliceEdge>();
  for (const edge of edges) {
    const sliceEdge = toSliceEdge(edge);
    if (sliceEdge === null) continue;
    seen.set(keyOf(sliceEdge), sliceEdge);
  }
  return [...seen.values()];
}
