import { assert, assertEquals } from "@std/assert";
import { runDenoLintJson } from "./deno-lint-json.ts";

function withTempFile(
  source: string,
  run: (dir: string) => Promise<void>,
): Promise<void> {
  const dir = Deno.makeTempDirSync();
  Deno.writeTextFileSync(`${dir}/deno.json`, "{}");
  Deno.writeTextFileSync(`${dir}/a.ts`, source);
  return run(dir).finally(() => Deno.removeSync(dir, { recursive: true }));
}

Deno.test("happy: a clean file produces zero diagnostics", async () => {
  await withTempFile("export const value = 1;\n", async (dir) => {
    const result = await runDenoLintJson(dir, ["a.ts"]);
    assert(result.ok);
    assertEquals(result.ok && result.diagnostics.length, 0);
  });
});

Deno.test("sad: a builtin-rule violation is reported with a bare code", async () => {
  await withTempFile("var value = 1;\nconsole.log(value);\n", async (dir) => {
    const result = await runDenoLintJson(dir, ["a.ts"]);
    assert(result.ok);
    assert(
      result.ok &&
        result.diagnostics.some((diagnostic) => diagnostic.code === "no-var"),
    );
  });
});

Deno.test("edge: the diagnostic range carries a 1-based start line", async () => {
  await withTempFile("var value = 1;\nconsole.log(value);\n", async (dir) => {
    const result = await runDenoLintJson(dir, ["a.ts"]);
    assert(result.ok);
    const found = result.ok
      ? result.diagnostics.find((diagnostic) => diagnostic.code === "no-var")
      : undefined;
    assertEquals(found?.range.start.line, 1);
  });
});
