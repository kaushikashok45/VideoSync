import { assertEquals } from "@std/assert";
import { runMutation } from "./run-mutation.ts";

function sh(cwd: string, args: string[]): void {
  const result = new Deno.Command("git", { args: [...args], cwd })
    .outputSync();
  if (!result.success) {
    throw new Error(new TextDecoder().decode(result.stderr));
  }
}

function baseRepo(): string {
  const dir = Deno.makeTempDirSync({ prefix: "run-mutation-fixture-" });
  sh(dir, ["init", "-q"]);
  sh(dir, ["config", "user.email", "a@b.com"]);
  sh(dir, ["config", "user.name", "a"]);
  Deno.mkdirSync(`${dir}/app`, { recursive: true });
  Deno.mkdirSync(`${dir}/tools/graph`, { recursive: true });
  return dir;
}

function writeEdge(dir: string, from: string, to: string): void {
  Deno.writeTextFileSync(
    `${dir}/tools/graph/edges.jsonl`,
    JSON.stringify({ from, to, fromSlice: null, toSlice: null }) + "\n",
  );
}

function commitAll(dir: string): void {
  sh(dir, ["add", "."]);
  sh(dir, ["commit", "-q", "-m", "seed"]);
}

function seedWellTestedModule(dir: string, testBody: string): void {
  Deno.writeTextFileSync(
    `${dir}/app/mod.ts`,
    "export function isPositive(x: number): boolean {\n  return x > 0;\n}\n",
  );
  Deno.writeTextFileSync(
    `${dir}/app/mod.test.ts`,
    [
      'import { assertEquals } from "jsr:@std/assert";',
      'import { isPositive } from "./mod.ts";',
      testBody,
      "",
    ].join("\n"),
  );
  writeEdge(dir, "app/mod.test.ts", "app/mod.ts");
  commitAll(dir);
}

Deno.test("happy: a well-tested module is fully killed, exit 0", () => {
  const dir = baseRepo();
  seedWellTestedModule(
    dir,
    'Deno.test("p", () => { assertEquals(isPositive(1), true); ' +
      "assertEquals(isPositive(0), false); });",
  );
  try {
    const run = runMutation(["--all"], dir);
    assertEquals(run.results.length, 1);
    assertEquals(run.results[0].generated >= 1, true);
    assertEquals(run.results[0].survived, 0);
    assertEquals(run.exitCode, 0);
  } finally {
    Deno.removeSync(dir, { recursive: true });
  }
});

Deno.test("sad: a deliberately weak test yields a named survivor, exit 1", () => {
  const dir = baseRepo();
  seedWellTestedModule(
    dir,
    'Deno.test("smoke", () => { assertEquals(typeof isPositive(1), "boolean"); });',
  );
  try {
    const run = runMutation(["--all"], dir);
    assertEquals(run.exitCode, 1);
    assertEquals(run.results[0].survived >= 1, true);
    assertEquals(run.results[0].testFiles, ["app/mod.test.ts"]);
  } finally {
    Deno.removeSync(dir, { recursive: true });
  }
});

function seedUntestedModuleWithDynamicImportElsewhere(dir: string): void {
  Deno.mkdirSync(`${dir}/server`, { recursive: true });
  Deno.writeTextFileSync(
    `${dir}/server/loader.ts`,
    "export function load(p: string) {\n  return import(p);\n}\n",
  );
  Deno.writeTextFileSync(
    `${dir}/app/mod.ts`,
    "export function isPositive(x: number): boolean {\n  return x > 0;\n}\n",
  );
  Deno.writeTextFileSync(`${dir}/app/mod.test.ts`, "// no import of mod.ts\n");
  commitAll(dir);
}

Deno.test("edge: an unreachable dynamic import plus an untested file is a harness error, exit 2", () => {
  const dir = baseRepo();
  seedUntestedModuleWithDynamicImportElsewhere(dir);
  try {
    const run = runMutation(["--all"], dir);
    const modResult = run.results.find((result) =>
      result.file === "app/mod.ts"
    );
    assertEquals(modResult?.harnessError, true);
    assertEquals(run.exitCode, 2);
  } finally {
    Deno.removeSync(dir, { recursive: true });
  }
});

Deno.test("logical-limits: no changed/all flag mutates nothing, exit 0", () => {
  const dir = baseRepo();
  Deno.writeTextFileSync(`${dir}/app/mod.ts`, "export const a = 1;\n");
  commitAll(dir);
  try {
    const run = runMutation([], dir);
    assertEquals(run, { exitCode: 0, results: [] });
  } finally {
    Deno.removeSync(dir, { recursive: true });
  }
});
