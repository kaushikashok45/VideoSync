import { assertEquals } from "@std/assert";
import { classifyMutant } from "./classify-mutant.ts";

function fixtureDir(): string {
  const dir = Deno.makeTempDirSync({ prefix: "classify-mutant-fixture-" });
  Deno.writeTextFileSync(
    `${dir}/mod.ts`,
    "export function add(a: number, b: number): number {\n  return a + b;\n}\n",
  );
  Deno.writeTextFileSync(
    `${dir}/mod.test.ts`,
    [
      'import { assertEquals } from "jsr:@std/assert";',
      'import { add } from "./mod.ts";',
      'Deno.test("adds", () => { assertEquals(add(1, 2), 3); });',
      "",
    ].join("\n"),
  );
  return dir;
}

Deno.test("happy: a caught behavior mutant is killed", () => {
  const dir = fixtureDir();
  try {
    Deno.writeTextFileSync(
      `${dir}/mod.ts`,
      "export function add(a: number, b: number): number {\n  return a - b;\n}\n",
    );
    assertEquals(classifyMutant(dir, "mod.ts", ["mod.test.ts"]), "killed");
  } finally {
    Deno.removeSync(dir, { recursive: true });
  }
});

Deno.test("edge: a type-breaking mutant is killed-by-types, without running tests", () => {
  const dir = fixtureDir();
  try {
    Deno.writeTextFileSync(
      `${dir}/mod.ts`,
      'export function add(a: number, b: number): number {\n  return "nope";\n}\n',
    );
    assertEquals(
      classifyMutant(dir, "mod.ts", ["mod.test.ts"]),
      "killed-by-types",
    );
  } finally {
    Deno.removeSync(dir, { recursive: true });
  }
});

Deno.test("sad: an equivalent mutant with no test files survives trivially", () => {
  const dir = fixtureDir();
  try {
    assertEquals(classifyMutant(dir, "mod.ts", []), "survived");
  } finally {
    Deno.removeSync(dir, { recursive: true });
  }
});

Deno.test("logical-limits: an uncaught behavior mutant survives", () => {
  const dir = fixtureDir();
  try {
    Deno.writeTextFileSync(
      `${dir}/mod.ts`,
      "export function add(a: number, b: number): number {\n  return a + b + 0;\n}\n",
    );
    assertEquals(classifyMutant(dir, "mod.ts", ["mod.test.ts"]), "survived");
  } finally {
    Deno.removeSync(dir, { recursive: true });
  }
});
