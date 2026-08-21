import { assertEquals } from "@std/assert";
import { conditionNegationSites } from "./condition-negation.ts";

Deno.test("happy: negates an if condition", () => {
  const source = "if (x) { y(); }";
  const sites = conditionNegationSites(source, "probe.ts");
  assertEquals(sites.length, 1);
  assertEquals(sites[0].replacement, "!(x)");
});

Deno.test("edge: negates a ternary condition", () => {
  const sites = conditionNegationSites("x ? 1 : 2;", "probe.ts");
  assertEquals(sites[0].replacement, "!(x)");
});

Deno.test("sad: a function with no condition produces no sites", () => {
  assertEquals(conditionNegationSites("const x = 1;", "probe.ts"), []);
});
