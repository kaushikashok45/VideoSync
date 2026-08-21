import { readEdgesJsonl } from "../graph/read-edges.ts";
import { sliceEdgesFrom } from "../graph/slice-graph.ts";
import { findCycles } from "../graph/cycles.ts";

const REPO_ROOT = new URL("../../", import.meta.url).pathname.replace(
  /\/$/,
  "",
);

/**
 * Prints the frozen `A -> B -> C -> A` cycle report from `edges.jsonl`, one
 * per line -- a human-readable view of `cycles.ts`'s deterministic output,
 * not a lint rule. `tools/cli/**`'s output-contract exemption from
 * `no-console` applies here for the same reason it applies to
 * `plugin-check-runner.ts`: this is the program's output, not logging.
 */
function run(edgesPath: string): number {
  const edges = readEdgesJsonl(edgesPath);
  const cycles = findCycles(sliceEdgesFrom(edges));
  if (cycles.length === 0) {
    console.log("no cycles found");
    return 0;
  }
  for (const cycle of cycles) console.log(cycle);
  return 0;
}

if (import.meta.main) {
  Deno.exit(run(`${REPO_ROOT}/tools/graph/edges.jsonl`));
}

export { run as printCycles };
