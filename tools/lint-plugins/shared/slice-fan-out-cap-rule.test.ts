import { assertEquals } from "@std/assert";
import { createBoundaryRuleKit } from "./boundary-rule-kit.ts";
import { createSliceFanOutCapRule } from "./slice-fan-out-cap-rule.ts";
import { fingerprintStatements } from "./body-fingerprint.ts";
import { classify } from "./fsd-path.ts";
import { violationIdentity } from "../../baseline/identity.ts";
import type { Suppressor } from "../../contracts/suppress";
import type { ViolationSite } from "../../contracts/identity";

const REPO_ROOT = "/repo";
const SOURCE = "export const a = 1;\n";
const FILENAME = `${REPO_ROOT}/app/features/f1/model/thing.ts`;
const RELATIVE_PATH = "app/features/f1/model/thing.ts";

function fakeProbes(): {
  claimReport(sliceRoot: string, ruleId: string): boolean;
} {
  const claimed = new Set<string>();
  return {
    claimReport(sliceRoot, ruleId) {
      const key = `${sliceRoot} ${ruleId}`;
      if (claimed.has(key)) return false;
      claimed.add(key);
      return true;
    },
  };
}

function diagnosticsFor(
  fanOut: number,
  suppressor: Suppressor,
): Deno.lint.Diagnostic[] {
  const kit = createBoundaryRuleKit(REPO_ROOT);
  const fanOutBySlice = new Map([["app/features/f1", fanOut]]);
  const plugin: Deno.lint.Plugin = {
    name: "boundary",
    rules: {
      "slice-fan-out-cap": createSliceFanOutCapRule(
        kit,
        suppressor,
        fakeProbes(),
        fanOutBySlice,
      ),
    },
  };
  return Deno.lint.runPlugin(plugin, FILENAME, SOURCE);
}

function openSuppressor(): Suppressor {
  return { loaded: true, isKnown: () => false };
}

Deno.test("happy: a slice with 4 outgoing slices fails slice-fan-out-cap", () => {
  assertEquals(diagnosticsFor(4, openSuppressor()).length, 1);
});

Deno.test("sad: a slice with exactly 3 outgoing slices is a compliant near-miss", () => {
  assertEquals(diagnosticsFor(3, openSuppressor()).length, 0);
});

Deno.test("edge: a slice absent from the fan-out map is treated as zero (compliant)", () => {
  const kit = createBoundaryRuleKit(REPO_ROOT);
  const plugin: Deno.lint.Plugin = {
    name: "boundary",
    rules: {
      "slice-fan-out-cap": createSliceFanOutCapRule(
        kit,
        openSuppressor(),
        fakeProbes(),
        new Map(),
      ),
    },
  };
  assertEquals(Deno.lint.runPlugin(plugin, FILENAME, SOURCE).length, 0);
});

/**
 * This rule reports via `reportForSlice` -- identity keyed on the slice
 * root, with a constant body fingerprint -- so identity is anchor-file
 * independent [why](docs/DECISIONS.md#ad-009): whichever file in the slice
 * happens to win the `claimReport` latch must not change what gets frozen.
 */
function siteFor(): ViolationSite {
  return {
    ruleId: "boundary/slice-fan-out-cap",
    enclosingFunction: "",
    paramCount: -1,
    bodyFingerprint: fingerprintStatements([], ""),
    sliceKey: classify(FILENAME).sliceRoot,
  };
}

Deno.test("suppression: a known identity in a known path is silently suppressed", () => {
  const id = violationIdentity(siteFor());
  const suppressor: Suppressor = {
    loaded: true,
    isKnown: (path, identity) => path === RELATIVE_PATH && identity === id,
  };
  assertEquals(diagnosticsFor(4, suppressor).length, 0);
});

Deno.test("suppression: a known identity with an unknown path is still reported (new-path zero tolerance)", () => {
  const id = violationIdentity(siteFor());
  const suppressor: Suppressor = {
    loaded: true,
    isKnown: (path, identity) =>
      path === "app/features/other/model/thing.ts" && identity === id,
  };
  assertEquals(diagnosticsFor(4, suppressor).length, 1);
});
