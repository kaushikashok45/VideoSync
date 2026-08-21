import { createImportRule } from "./import-rule.ts";
import { createBoundaryRuleKit } from "./boundary-rule-kit.ts";
import type { Suppressor } from "../../contracts/suppress";

type Kit = ReturnType<typeof createBoundaryRuleKit>;

interface Resolver {
  resolve(raw: string, fromFile: string): { absolutePath: string | null };
}

const RULE_ID = "boundary/layer-order";

/**
 * ARCH-001: a module may import its own FSD layer and lower-numbered layers
 * only. Both layer numbers are read straight off `classify()`, never
 * re-derived [why](docs/DECISIONS.md#ad-004). `shared/contracts/` sits at layer -1
 * below every `app/`/`server/` layer, so an import FROM contracts INTO
 * either root already violates this rule with no special case needed.
 */
export function createLayerOrderRule(
  kit: Kit,
  resolver: Resolver,
  suppressor: Suppressor,
): Deno.lint.Rule {
  return createImportRule(
    { kit, resolver, suppressor },
    RULE_ID,
    (source, target) => {
      if (Number.isNaN(target.layer)) return null;
      if (target.layer <= source.layer) return null;
      return `Importing layer "${target.layerName}" (${target.layer}) from ` +
        `layer "${source.layerName}" (${source.layer}) violates layer order.`;
    },
  );
}
