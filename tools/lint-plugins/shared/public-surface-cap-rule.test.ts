import { assertEquals } from "@std/assert";
import { createBoundaryRuleKit } from "./boundary-rule-kit.ts";
import { createPublicSurfaceCapRule } from "./public-surface-cap-rule.ts";
import { fingerprintStatements } from "./body-fingerprint.ts";
import { violationIdentity } from "../../baseline/identity.ts";
import type { Suppressor } from "../../contracts/suppress";
import type { ViolationSite } from "../../contracts/identity";

const REPO_ROOT = "/repo";

function exportsOf(count: number): string {
  return Array.from(
    { length: count },
    (_element, index) => `export const v${index} = ${index};\n`,
  ).join("");
}

function diagnosticsFor(
  source: string,
  filename: string,
  suppressor: Suppressor,
): Deno.lint.Diagnostic[] {
  const kit = createBoundaryRuleKit(REPO_ROOT);
  const plugin: Deno.lint.Plugin = {
    name: "boundary",
    rules: {
      "public-surface-cap": createPublicSurfaceCapRule(kit, suppressor),
    },
  };
  return Deno.lint.runPlugin(plugin, filename, source);
}

function openSuppressor(): Suppressor {
  return { loaded: true, isKnown: () => false };
}

Deno.test("happy: an index.ts exporting 8 symbols fails public-surface-cap", () => {
  const ds = diagnosticsFor(
    exportsOf(8),
    `${REPO_ROOT}/app/features/f1/index.ts`,
    openSuppressor(),
  );
  assertEquals(ds.length, 1);
});

Deno.test("sad: an index.ts exporting exactly 7 symbols is a compliant near-miss", () => {
  const ds = diagnosticsFor(
    exportsOf(7),
    `${REPO_ROOT}/app/features/f1/index.ts`,
    openSuppressor(),
  );
  assertEquals(ds.length, 0);
});

Deno.test("edge: a non-index.ts file with 8 exports is out of scope", () => {
  const ds = diagnosticsFor(
    exportsOf(8),
    `${REPO_ROOT}/app/features/f1/model/thing.ts`,
    openSuppressor(),
  );
  assertEquals(ds.length, 0);
});

function captureProgramRange(
  source: string,
  filename: string,
): readonly [number, number] {
  let captured: readonly [number, number] | undefined;
  const probe: Deno.lint.Plugin = {
    name: "probe",
    rules: {
      capture: {
        create(_context) {
          return { Program: (node) => (captured ??= node.range) };
        },
      },
    },
  };
  Deno.lint.runPlugin(probe, filename, source);
  if (!captured) throw new Error("expected a Program node");
  return captured;
}

function siteFor(source: string, filename: string): ViolationSite {
  const range = captureProgramRange(source, filename);
  return {
    ruleId: "boundary/public-surface-cap",
    enclosingFunction: "",
    paramCount: -1,
    bodyFingerprint: fingerprintStatements([{ range }], source),
    sliceKey: null,
  };
}

Deno.test("suppression: a known identity in a known path is silently suppressed", () => {
  const relativePath = "app/features/f1/index.ts";
  const source = exportsOf(8);
  const id = violationIdentity(siteFor(source, `${REPO_ROOT}/${relativePath}`));
  const suppressor: Suppressor = {
    loaded: true,
    isKnown: (path, identity) => path === relativePath && identity === id,
  };
  const ds = diagnosticsFor(source, `${REPO_ROOT}/${relativePath}`, suppressor);
  assertEquals(ds.length, 0);
});

Deno.test("suppression: a known identity with an unknown path is still reported (new-path zero tolerance)", () => {
  const relativePath = "app/features/f1/index.ts";
  const source = exportsOf(8);
  const id = violationIdentity(siteFor(source, `${REPO_ROOT}/${relativePath}`));
  const suppressor: Suppressor = {
    loaded: true,
    isKnown: (path, identity) =>
      path === "app/features/other/index.ts" && identity === id,
  };
  const ds = diagnosticsFor(source, `${REPO_ROOT}/${relativePath}`, suppressor);
  assertEquals(ds.length, 1);
});
