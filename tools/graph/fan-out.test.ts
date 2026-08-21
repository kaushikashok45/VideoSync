import { assertEquals } from "@std/assert";
import { fanOutCounts } from "./fan-out.ts";

Deno.test("happy: a slice with three distinct targets counts three", () => {
  const counts = fanOutCounts([
    { from: "s1", to: "s2" },
    { from: "s1", to: "s3" },
    { from: "s1", to: "s4" },
  ]);
  assertEquals(counts.get("s1"), 3);
});

Deno.test("sad: a slice with no outgoing edges is absent from the map", () => {
  const counts = fanOutCounts([{ from: "s1", to: "s2" }]);
  assertEquals(counts.has("s3"), false);
});

Deno.test("edge: duplicate edges to the same target count once", () => {
  const counts = fanOutCounts([
    { from: "s1", to: "s2" },
    { from: "s1", to: "s2" },
  ]);
  assertEquals(counts.get("s1"), 1);
});
