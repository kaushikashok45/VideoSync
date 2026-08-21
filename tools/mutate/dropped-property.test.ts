import { assertEquals } from "@std/assert";
import { droppedPropertySites } from "./dropped-property.ts";

function apply(source: string, index: number): string {
  const site = droppedPropertySites(source, "probe.ts")[index];
  return source.slice(0, site.start) + site.replacement +
    source.slice(site.end);
}

Deno.test("happy: drops a middle property, keeping the rest valid", () => {
  const source = "f({ a: 1, b: 2, c: 3 });";
  assertEquals(apply(source, 1), "f({ a: 1, c: 3 });");
});

Deno.test("edge: drops the first property", () => {
  const source = "f({ a: 1, b: 2 });";
  assertEquals(apply(source, 0), "f({ b: 2 });");
});

Deno.test("edge: drops the last property", () => {
  const source = "f({ a: 1, b: 2 });";
  assertEquals(apply(source, 1), "f({ a: 1 });");
});

Deno.test("sad: a call with no object argument produces no sites", () => {
  assertEquals(droppedPropertySites("f(1, 2);", "probe.ts"), []);
});
