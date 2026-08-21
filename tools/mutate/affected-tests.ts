import type { ImportEdge } from "../contracts/import-edge";

function reverseEdges(
  edges: readonly ImportEdge[],
): ReadonlyMap<string, readonly string[]> {
  const reverse = new Map<string, string[]>();
  for (const edge of edges) {
    const callers = reverse.get(edge.to) ?? [];
    callers.push(edge.from);
    reverse.set(edge.to, callers);
  }
  return reverse;
}

function visitCallers(
  current: string,
  reverse: ReadonlyMap<string, readonly string[]>,
  seen: Set<string>,
  queue: string[],
): void {
  for (const caller of reverse.get(current) ?? []) {
    if (seen.has(caller)) continue;
    seen.add(caller);
    queue.push(caller);
  }
}

export function affectedTests(
  target: string,
  edges: readonly ImportEdge[],
): readonly string[] {
  const reverse = reverseEdges(edges);
  const seen = new Set<string>([target]);
  const queue = [target];
  while (queue.length > 0) {
    const current = queue.shift();
    if (current === undefined) continue;
    visitCallers(current, reverse, seen, queue);
  }
  return [...seen].filter((path) =>
    path.endsWith(".test.ts") || path.endsWith(".test.tsx")
  );
}
