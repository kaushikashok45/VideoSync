import { assertEquals } from "@std/assert";
import { sliceEdgesFrom } from "./slice-graph.ts";

Deno.test("happy: a cross-slice edge with both slices set is kept", () => {
  const edges = sliceEdgesFrom([
    { from: "a.ts", to: "b.ts", fromSlice: "s1", toSlice: "s2" },
  ]);
  assertEquals(edges, [{ from: "s1", to: "s2" }]);
});

Deno.test("sad: a same-slice edge is dropped", () => {
  const edges = sliceEdgesFrom([
    { from: "a.ts", to: "b.ts", fromSlice: "s1", toSlice: "s1" },
  ]);
  assertEquals(edges, []);
});

Deno.test("edge: an edge with no slice on either end is dropped", () => {
  const edges = sliceEdgesFrom([
    { from: "a.ts", to: "b.ts", fromSlice: null, toSlice: null },
    { from: "a.ts", to: "b.ts", fromSlice: "s1", toSlice: null },
  ]);
  assertEquals(edges, []);
});

Deno.test("edge: two file-level edges between the same two slices dedupe to one", () => {
  const edges = sliceEdgesFrom([
    { from: "a.ts", to: "c.ts", fromSlice: "s1", toSlice: "s2" },
    { from: "b.ts", to: "d.ts", fromSlice: "s1", toSlice: "s2" },
  ]);
  assertEquals(edges, [{ from: "s1", to: "s2" }]);
});
