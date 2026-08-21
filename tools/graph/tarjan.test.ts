import { assertEquals } from "@std/assert";
import { computeSccs } from "./tarjan.ts";

Deno.test("happy: a mutual pair forms one two-member SCC", () => {
  const { sccs } = computeSccs([
    { from: "a", to: "b" },
    { from: "b", to: "a" },
  ]);
  assertEquals(sccs.length, 1);
  assertEquals(new Set(sccs[0]), new Set(["a", "b"]));
});

Deno.test("sad: a DAG produces one singleton SCC per node", () => {
  const { sccs } = computeSccs([{ from: "a", to: "b" }]);
  assertEquals(sccs.length, 2);
  for (const scc of sccs) assertEquals(scc.length, 1);
});

Deno.test("edge: adjacency lists are sorted for deterministic traversal", () => {
  const { adjacency } = computeSccs([
    { from: "a", to: "c" },
    { from: "a", to: "b" },
  ]);
  assertEquals(adjacency.get("a"), ["b", "c"]);
});
