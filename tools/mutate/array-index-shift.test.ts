import { assertEquals } from "@std/assert";
import { arrayIndexShiftSites } from "./array-index-shift.ts";

Deno.test("happy: shifts a numeric array index by one", () => {
  const sites = arrayIndexShiftSites("const x = arr[2];", "probe.ts");
  assertEquals(sites.map((site) => site.replacement), ["3"]);
});

Deno.test("edge: a non-computed member access produces no sites", () => {
  assertEquals(arrayIndexShiftSites("const x = arr.length;", "probe.ts"), []);
});

Deno.test("sad: a computed non-numeric key produces no sites", () => {
  assertEquals(arrayIndexShiftSites("const x = arr[key];", "probe.ts"), []);
});
