import type { SliceEdge } from "../contracts/slice-edge";

type Adjacency = ReadonlyMap<string, readonly string[]>;

interface TarjanState {
  readonly adjacency: Adjacency;
  readonly index: Map<string, number>;
  readonly lowlink: Map<string, number>;
  readonly onStack: Set<string>;
  readonly stack: string[];
  readonly sccs: string[][];
  counter: number;
}

function ensureNode(raw: Map<string, Set<string>>, node: string): Set<string> {
  const existing = raw.get(node);
  if (existing) return existing;
  const created = new Set<string>();
  raw.set(node, created);
  return created;
}

function addEdge(raw: Map<string, Set<string>>, edge: SliceEdge): void {
  ensureNode(raw, edge.from).add(edge.to);
  ensureNode(raw, edge.to);
}

/** Adjacency lists sorted so every downstream walk (SCC seed order, cycle reconstruction) is deterministic. */
function buildAdjacency(edges: readonly SliceEdge[]): Adjacency {
  const raw = new Map<string, Set<string>>();
  for (const edge of edges) addEdge(raw, edge);
  const sorted = new Map<string, readonly string[]>();
  for (const [node, targets] of raw) sorted.set(node, [...targets].sort());
  return sorted;
}

function popScc(state: TarjanState, node: string): void {
  const position = state.stack.indexOf(node);
  const members = state.stack.splice(position);
  for (const member of members) state.onStack.delete(member);
  state.sccs.push(members);
}

function lowlinkValue(state: TarjanState, node: string): number {
  return state.lowlink.get(node) ?? 0;
}

function indexValue(state: TarjanState, node: string): number {
  return state.index.get(node) ?? 0;
}

function visitNeighbor(
  state: TarjanState,
  node: string,
  neighbor: string,
): void {
  if (!state.index.has(neighbor)) {
    strongConnect(state, neighbor);
    const merged = Math.min(
      lowlinkValue(state, node),
      lowlinkValue(state, neighbor),
    );
    state.lowlink.set(node, merged);
  } else if (state.onStack.has(neighbor)) {
    const merged = Math.min(
      lowlinkValue(state, node),
      indexValue(state, neighbor),
    );
    state.lowlink.set(node, merged);
  }
}

function strongConnect(state: TarjanState, node: string): void {
  state.index.set(node, state.counter);
  state.lowlink.set(node, state.counter);
  state.counter += 1;
  state.stack.push(node);
  state.onStack.add(node);
  for (const neighbor of state.adjacency.get(node) ?? []) {
    visitNeighbor(state, node, neighbor);
  }
  if (state.lowlink.get(node) === state.index.get(node)) popScc(state, node);
}

function runTarjan(adjacency: Adjacency): readonly string[][] {
  const state: TarjanState = {
    adjacency,
    index: new Map(),
    lowlink: new Map(),
    onStack: new Set(),
    stack: [],
    sccs: [],
    counter: 0,
  };
  for (const node of [...adjacency.keys()].sort()) {
    if (!state.index.has(node)) strongConnect(state, node);
  }
  return state.sccs;
}

/**
 * Tarjan's strongly-connected-components algorithm over the slice graph.
 * Adjacency lists and the SCC seed order are both sorted, so re-running
 * over the same edge set always visits nodes in the same order --
 * `cycles.ts`'s determinism guarantee starts here, not in its own
 * formatting step.
 */
export function computeSccs(
  edges: readonly SliceEdge[],
): { sccs: readonly string[][]; adjacency: Adjacency } {
  const adjacency = buildAdjacency(edges);
  return { sccs: runTarjan(adjacency), adjacency };
}
