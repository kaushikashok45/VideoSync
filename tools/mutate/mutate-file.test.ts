import { assertEquals } from "@std/assert";
import { mutateFile } from "./mutate-file.ts";

function run(dir: string, args: readonly string[]): void {
  const result = new Deno.Command("git", { args: [...args], cwd: dir })
    .outputSync();
  if (!result.success) throw new Error(new TextDecoder().decode(result.stderr));
}

function writeFixtureFiles(dir: string): void {
  Deno.writeTextFileSync(
    `${dir}/mod.ts`,
    "export function isPositive(x: number): boolean {\n  return x > 0;\n}\n",
  );
  Deno.writeTextFileSync(
    `${dir}/mod.test.ts`,
    [
      'import { assertEquals } from "jsr:@std/assert";',
      'import { isPositive } from "./mod.ts";',
      'Deno.test("positive", () => { assertEquals(isPositive(1), true); });',
      'Deno.test("non-positive", () => { assertEquals(isPositive(0), false); });',
      "",
    ].join("\n"),
  );
}

function gitFixture(): string {
  const dir = Deno.makeTempDirSync({ prefix: "mutate-file-fixture-" });
  run(dir, ["init", "-q"]);
  run(dir, ["config", "user.email", "test@example.com"]);
  run(dir, ["config", "user.name", "test"]);
  writeFixtureFiles(dir);
  run(dir, ["add", "."]);
  run(dir, ["commit", "-q", "-m", "seed"]);
  return dir;
}

Deno.test("happy: comparison-flip mutant is killed and the file is restored", () => {
  const dir = gitFixture();
  try {
    const result = mutateFile(dir, "mod.ts", ["mod.test.ts"]);
    assertEquals(result.generated >= 1, true);
    assertEquals(result.killed >= 1, true);
    assertEquals(
      Deno.readTextFileSync(`${dir}/mod.ts`),
      "export function isPositive(x: number): boolean {\n  return x > 0;\n}\n",
    );
  } finally {
    Deno.removeSync(dir, { recursive: true });
  }
});

Deno.test("sad: no test files means every type-checking mutant survives", () => {
  const dir = gitFixture();
  try {
    const result = mutateFile(dir, "mod.ts", []);
    assertEquals(result.survived, result.generated);
    assertEquals(result.killed, 0);
  } finally {
    Deno.removeSync(dir, { recursive: true });
  }
});
