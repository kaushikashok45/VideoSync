import { assertEquals } from "@std/assert";
import { createBoundaryRuleKit } from "./boundary-rule-kit.ts";
import { createNoStarExportRule } from "./no-star-export-rule.ts";
import type { Suppressor } from "../../contracts/suppress";

const REPO_ROOT = "/repo";

function diagnosticsFor(
  source: string,
  filename: string,
  suppressor: Suppressor,
): Deno.lint.Diagnostic[] {
  const kit = createBoundaryRuleKit(REPO_ROOT);
  const plugin: Deno.lint.Plugin = {
    name: "boundary",
    rules: {
      "no-star-export": createNoStarExportRule(kit, suppressor),
    },
  };
  return Deno.lint.runPlugin(plugin, filename, source);
}

function openSuppressor(): Suppressor {
  return { loaded: true, isKnown: () => false };
}

Deno.test("sad: a slice index.ts using export * from reports exactly one diagnostic", () => {
  const ds = diagnosticsFor(
    'export * from "./model/thing.ts";\n',
    `${REPO_ROOT}/app/features/f1/index.ts`,
    openSuppressor(),
  );
  assertEquals(ds.length, 1);
});

Deno.test("happy: a slice index.ts using named re-exports reports none", () => {
  const ds = diagnosticsFor(
    'export { thing } from "./model/thing.ts";\n',
    `${REPO_ROOT}/app/features/f1/index.ts`,
    openSuppressor(),
  );
  assertEquals(ds.length, 0);
});

Deno.test("edge: a non-index.ts file using export * is not this rule's concern", () => {
  const ds = diagnosticsFor(
    'export * from "./thing.ts";\n',
    `${REPO_ROOT}/app/features/f1/model/thing.ts`,
    openSuppressor(),
  );
  assertEquals(ds.length, 0);
});

Deno.test("edge: two export * statements in one index.ts report two diagnostics", () => {
  const ds = diagnosticsFor(
    'export * from "./model/a.ts";\nexport * from "./model/b.ts";\n',
    `${REPO_ROOT}/app/features/f1/index.ts`,
    openSuppressor(),
  );
  assertEquals(ds.length, 2);
});
