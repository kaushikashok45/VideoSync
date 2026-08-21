import { assertEquals } from "@std/assert";
import { findCycles } from "./cycles.ts";

Deno.test("happy: a known 3-node cycle is reported starting at its smallest member", () => {
  const cycles = findCycles([
    { from: "b", to: "c" },
    { from: "c", to: "a" },
    { from: "a", to: "b" },
  ]);
  assertEquals(cycles, ["a -> b -> c -> a"]);
});

Deno.test("edge: a self-loop is reported as a single-node cycle", () => {
  const cycles = findCycles([{ from: "a", to: "a" }]);
  assertEquals(cycles, ["a -> a"]);
});

Deno.test("sad: a DAG produces zero cycles", () => {
  const cycles = findCycles([
    { from: "a", to: "b" },
    { from: "b", to: "c" },
    { from: "a", to: "c" },
  ]);
  assertEquals(cycles, []);
});

Deno.test("edge: two disjoint cycles are both reported, sorted", () => {
  const cycles = findCycles([
    { from: "z", to: "y" },
    { from: "y", to: "z" },
    { from: "b", to: "a" },
    { from: "a", to: "b" },
  ]);
  assertEquals(cycles, ["a -> b -> a", "y -> z -> y"]);
});

Deno.test("logical-limits: a node with no cycle through it is never reported", () => {
  const cycles = findCycles([
    { from: "a", to: "b" },
    { from: "b", to: "a" },
    { from: "a", to: "c" },
  ]);
  assertEquals(cycles, ["a -> b -> a"]);
});

Deno.test("determinism: the exact output string for a fixed input graph never changes", () => {
  const edges = [
    { from: "entry-flow", to: "media-source" },
    { from: "media-source", to: "entry-flow" },
    { from: "widget", to: "entity" },
  ];
  const first = findCycles(edges);
  const second = findCycles([...edges].reverse());
  assertEquals(first, ["entry-flow -> media-source -> entry-flow"]);
  assertEquals(second, first);
});
