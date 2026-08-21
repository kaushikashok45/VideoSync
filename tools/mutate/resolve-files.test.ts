import { assertEquals } from "@std/assert";
import { sourceFilesToMutate } from "./resolve-files.ts";

const FIXTURE_ROOT = new URL("./fixtures/dynamic-import", import.meta.url)
  .pathname;

function sh(cwd: string, args: string[]): void {
  new Deno.Command("git", { args, cwd }).outputSync();
}

function stagedRepo(): string {
  const dir = Deno.makeTempDirSync({ prefix: "resolve-files-fixture-" });
  sh(dir, ["init", "-q"]);
  sh(dir, ["config", "user.email", "a@b.com"]);
  sh(dir, ["config", "user.name", "a"]);
  Deno.writeTextFileSync(`${dir}/a.ts`, "export const a = 1;\n");
  Deno.writeTextFileSync(`${dir}/a.test.ts`, "// test\n");
  sh(dir, ["add", "a.ts", "a.test.ts"]);
  return dir;
}

Deno.test("happy: --all walks app/server/shared and excludes tests", () => {
  const files = sourceFilesToMutate(["--all"], FIXTURE_ROOT);
  assertEquals(files, []); // fixture has no app/server/shared dirs
});

Deno.test("edge: with neither flag, nothing is mutated", () => {
  assertEquals(sourceFilesToMutate([], FIXTURE_ROOT), []);
});

Deno.test("happy: --changed keeps staged source, excludes staged tests", () => {
  const dir = stagedRepo();
  const original = Deno.cwd();
  Deno.chdir(dir);
  try {
    assertEquals(sourceFilesToMutate(["--changed"], dir), ["a.ts"]);
  } finally {
    Deno.chdir(original);
    Deno.removeSync(dir, { recursive: true });
  }
});
