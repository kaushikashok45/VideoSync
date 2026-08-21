import { ignoreExpectedFailure } from "../lint-plugins/shared/ignore-expected-failure.ts";
import type { ImportEdge } from "../contracts/import-edge";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isImportEdge(value: unknown): value is ImportEdge {
  if (!isRecord(value)) return false;
  return typeof value.from === "string" && typeof value.to === "string";
}

function parseLine(line: string): ImportEdge | null {
  if (line.length === 0) return null;
  try {
    const parsed = JSON.parse(line);
    return isImportEdge(parsed) ? parsed : null;
  } catch (error) {
    ignoreExpectedFailure(error);
    return null;
  }
}

/**
 * Reads `edges.jsonl`, failing to an empty graph rather than throwing --
 * a plugin construction failure over a generated, gitignored file the
 * graph task has simply not been run yet would be worse than reporting no
 * fan-out/cycle findings until it is.
 */
export function readEdgesJsonl(path: string): readonly ImportEdge[] {
  let text: string;
  try {
    text = Deno.readTextFileSync(path);
  } catch (error) {
    ignoreExpectedFailure(error);
    return [];
  }
  const edges: ImportEdge[] = [];
  for (const line of text.split("\n")) {
    const edge = parseLine(line.trim());
    if (edge !== null) edges.push(edge);
  }
  return edges;
}
