import { computeSccs } from "./tarjan.ts";
import type { SliceEdge } from "../contracts/slice-edge";

type Adjacency = ReadonlyMap<string, readonly string[]>;

function hasSelfLoop(adjacency: Adjacency, node: string): boolean {
  return (adjacency.get(node) ?? []).includes(node);
}

function isCycle(adjacency: Adjacency, members: readonly string[]): boolean {
  return members.length > 1 || hasSelfLoop(adjacency, members[0]);
}

function nextInCycle(
  adjacency: Adjacency,
  members: ReadonlySet<string>,
  current: string,
): string | undefined {
  return (adjacency.get(current) ?? []).find((candidate) =>
    members.has(candidate)
  );
}

/** Follows sorted within-SCC neighbors from the smallest member until it returns there. */
function reconstructCycle(
  adjacency: Adjacency,
  members: readonly string[],
): readonly string[] {
  const memberSet = new Set(members);
  const start = [...members].sort()[0];
  const path: string[] = [start];
  let current = start;
  for (let step = 0; step < members.length; step++) {
    const next = nextInCycle(adjacency, memberSet, current);
    if (next === undefined || next === start) break;
    path.push(next);
    current = next;
  }
  return path;
}

function formatCycle(path: readonly string[]): string {
  return [...path, path[0]].join(" -> ");
}

/**
 * Every strongly-connected component in the slice graph, reported as a
 * formatted `A -> B -> C -> A` cycle path -- a multi-member SCC or a
 * single-node self-loop, never a size-1 SCC with no self-loop (that is
 * just a node with no cycle through it). The returned list is sorted so
 * re-running over the same graph always yields byte-identical output, the
 * property the frozen ratchet baseline depends on.
 */
export function findCycles(edges: readonly SliceEdge[]): readonly string[] {
  const { sccs, adjacency } = computeSccs(edges);
  const cycles = sccs
    .filter((members) => isCycle(adjacency, members))
    .map((members) => formatCycle(reconstructCycle(adjacency, members)));
  return cycles.sort();
}
