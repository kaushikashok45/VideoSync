import { assertEquals } from "@std/assert";
import { nonLiteralDynamicImportSites } from "./dynamic-import-sites.ts";

const FIXTURE_ROOT = new URL("./fixtures/dynamic-import", import.meta.url)
  .pathname;

Deno.test("happy: reports only the non-literal import() site, with its line", () => {
  const sites = nonLiteralDynamicImportSites(FIXTURE_ROOT, ["src"]);
  assertEquals(sites.length, 1);
  assertEquals(sites[0].file, "src/mixed.ts");
  assertEquals(sites[0].line, 2);
});

Deno.test("edge: a tree with only literal dynamic imports reports nothing", () => {
  const sites = nonLiteralDynamicImportSites(FIXTURE_ROOT, ["literal-only"]);
  assertEquals(sites, []);
});

Deno.test("sad: a missing root reports nothing rather than throwing", () => {
  assertEquals(nonLiteralDynamicImportSites(FIXTURE_ROOT, ["nope"]), []);
});
