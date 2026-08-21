import type { ImportEdge } from "../contracts/import-edge";

/** Writes one `ImportEdge` per line, so the ratchet diffs one edge at a time. */
export function writeEdgesJsonl(
  path: string,
  edges: readonly ImportEdge[],
): void {
  const lines = edges.map((edge) => JSON.stringify(edge));
  Deno.writeTextFileSync(
    path,
    lines.join("\n") + (lines.length > 0 ? "\n" : ""),
  );
}
