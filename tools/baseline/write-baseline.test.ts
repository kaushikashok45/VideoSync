import { assertEquals } from "@std/assert";
import { writeBaselineFile } from "./write-baseline.ts";
import type { PersistedBaseline } from "../contracts/baseline-generate";

function sample(): PersistedBaseline {
  return {
    version: 1,
    generatedAt: "2026-08-20T00:00:00Z",
    paths: ["a.ts"],
    violations: { "id-1": 1 },
    perFile: { "a.ts": 1 },
    perRule: { "structural/complexity": 1 },
    log: [],
  };
}

Deno.test("happy: writes valid, parseable JSON matching the given baseline", () => {
  const dir = Deno.makeTempDirSync();
  const path = `${dir}/baseline.json`;
  writeBaselineFile(path, sample());
  const parsed = JSON.parse(Deno.readTextFileSync(path));
  assertEquals(parsed, sample());
  Deno.removeSync(dir, { recursive: true });
});

Deno.test("edge: the file ends with a trailing newline", () => {
  const dir = Deno.makeTempDirSync();
  const path = `${dir}/baseline.json`;
  writeBaselineFile(path, sample());
  const text = Deno.readTextFileSync(path);
  assertEquals(text.endsWith("\n"), true);
  Deno.removeSync(dir, { recursive: true });
});
