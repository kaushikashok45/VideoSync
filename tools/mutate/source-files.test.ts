import { assertEquals } from "@std/assert";
import { sourceFilesUnder } from "./source-files.ts";

const FIXTURE_ROOT = new URL("./fixtures/dynamic-import", import.meta.url)
  .pathname;

Deno.test("happy: finds .ts files under a directory", () => {
  const files = sourceFilesUnder(`${FIXTURE_ROOT}/src`);
  assertEquals(files.length, 1);
  assertEquals(files[0].endsWith("mixed.ts"), true);
});

Deno.test("edge: a hidden or node_modules entry is skipped", () => {
  const files = sourceFilesUnder(FIXTURE_ROOT);
  assertEquals(files.every((file) => !file.includes("/.")), true);
});

Deno.test("sad: a missing directory returns an empty list, not a throw", () => {
  assertEquals(sourceFilesUnder(`${FIXTURE_ROOT}/nope`), []);
});
