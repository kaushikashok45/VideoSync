import { assertEquals } from "@std/assert";
import { numericOffByOneSites } from "./numeric-off-by-one.ts";

Deno.test("happy: shifts a numeric literal up by one", () => {
  const sites = numericOffByOneSites("const x = 4;", "probe.ts");
  assertEquals(sites.map((site) => site.replacement), ["5"]);
});

Deno.test("edge: a string literal produces no sites", () => {
  assertEquals(numericOffByOneSites("const x = '4';", "probe.ts"), []);
});

Deno.test("logical-limits: a negative-valued literal still shifts by one", () => {
  const sites = numericOffByOneSites("const x = 0;", "probe.ts");
  assertEquals(sites[0].replacement, "1");
});
