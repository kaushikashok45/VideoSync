import { assertEquals } from "@std/assert";
import { comparisonFlipSites } from "./comparison-flip.ts";

Deno.test("happy: flips === to !==", () => {
  const sites = comparisonFlipSites("x === 1;", "probe.ts");
  assertEquals(sites.map((site) => site.description), ["=== → !=="]);
});

Deno.test("edge: no comparison operator produces no sites", () => {
  assertEquals(comparisonFlipSites("x + 1;", "probe.ts"), []);
});

Deno.test("logical-limits: && is not a comparison flip site", () => {
  assertEquals(comparisonFlipSites("x && y;", "probe.ts"), []);
});
