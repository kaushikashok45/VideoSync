import { createImportRule } from "./import-rule.ts";
import { createBoundaryRuleKit } from "./boundary-rule-kit.ts";
import type { Suppressor } from "../../contracts/suppress";
import type { FsdPath } from "../../contracts/fsd-path";

type Kit = ReturnType<typeof createBoundaryRuleKit>;

interface Resolver {
  resolve(raw: string, fromFile: string): { absolutePath: string | null };
}

const RULE_ID = "boundary/deep-import";

function isCrossSliceEntry(source: FsdPath, target: FsdPath): boolean {
  if (target.slice === null) return false;
  return source.slice !== target.slice;
}

/**
 * ARCH-007: cross-slice access only through a slice's public entry. Applies
 * to any cross-slice import regardless of layer direction -- a same-slice
 * deep import is always fine, since `lib/` is reachable from its own
 * siblings by construction.
 */
export function createDeepImportRule(
  kit: Kit,
  resolver: Resolver,
  suppressor: Suppressor,
): Deno.lint.Rule {
  return createImportRule(
    { kit, resolver, suppressor },
    RULE_ID,
    (source, target) => {
      if (!isCrossSliceEntry(source, target)) return null;
      if (target.role === "index") return null;
      return "Cross-slice import must resolve to the target slice's " +
        "index.ts, not a deep path.";
    },
  );
}
