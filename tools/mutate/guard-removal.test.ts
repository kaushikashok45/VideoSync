import { assertEquals } from "@std/assert";
import { guardRemovalSites } from "./guard-removal.ts";

Deno.test("happy: removes a bare-return guard clause", () => {
  const source = "function f(x) { if (!x) return; return x; }";
  const sites = guardRemovalSites(source, "probe.ts");
  assertEquals(sites.length, 1);
  const mutated = source.slice(0, sites[0].start) + sites[0].replacement +
    source.slice(sites[0].end);
  assertEquals(mutated, "function f(x) {  return x; }");
});

Deno.test("edge: removes a block-bodied guard clause", () => {
  const source = "function f(x) { if (!x) { return; } return x; }";
  assertEquals(guardRemovalSites(source, "probe.ts").length, 1);
});

Deno.test("sad: an if/else is not a guard clause", () => {
  const source = "function f(x) { if (x) { return 1; } else { return 2; } }";
  assertEquals(guardRemovalSites(source, "probe.ts"), []);
});

Deno.test("logical-limits: an if with non-return body is not a guard clause", () => {
  const source = "function f(x) { if (x) { log(x); } }";
  assertEquals(guardRemovalSites(source, "probe.ts"), []);
});
