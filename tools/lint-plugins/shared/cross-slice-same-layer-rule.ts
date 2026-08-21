import { createImportRule } from "./import-rule.ts";
import { createBoundaryRuleKit } from "./boundary-rule-kit.ts";
import type { Suppressor } from "../../contracts/suppress";
import type { FsdPath } from "../../contracts/fsd-path";

type Kit = ReturnType<typeof createBoundaryRuleKit>;

interface Resolver {
  resolve(raw: string, fromFile: string): { absolutePath: string | null };
}

const RULE_ID = "boundary/cross-slice-same-layer";

function isLateralCrossSlice(source: FsdPath, target: FsdPath): boolean {
  if (source.slice === null || target.slice === null) return false;
  if (source.slice === target.slice) return false;
  return source.layer === target.layer;
}

/**
 * `layer-order` alone permits a same-layer sibling import (no direction
 * violation), so it cannot close the lateral gap: a sibling slice at the
 * same layer may still only be reached through its public entry.
 */
export function createCrossSliceSameLayerRule(
  kit: Kit,
  resolver: Resolver,
  suppressor: Suppressor,
): Deno.lint.Rule {
  return createImportRule(
    { kit, resolver, suppressor },
    RULE_ID,
    (source, target) => {
      if (!isLateralCrossSlice(source, target)) return null;
      if (target.role === "index") return null;
      return "A same-layer cross-slice import must go through the target " +
        "slice's index.ts.";
    },
  );
}
