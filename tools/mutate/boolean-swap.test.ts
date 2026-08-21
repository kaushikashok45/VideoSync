import { assertEquals } from "@std/assert";
import { booleanSwapSites } from "./boolean-swap.ts";

Deno.test("happy: swaps true for false", () => {
  const sites = booleanSwapSites("const x = true;", "probe.ts");
  assertEquals(sites.map((site) => site.replacement), ["false"]);
});

Deno.test("edge: swaps false for true", () => {
  const sites = booleanSwapSites("const x = false;", "probe.ts");
  assertEquals(sites.map((site) => site.replacement), ["true"]);
});

Deno.test("sad: a non-boolean literal produces no sites", () => {
  assertEquals(booleanSwapSites("const x = 1;", "probe.ts"), []);
});
