import { countProgramExports } from "./export-count.ts";
import type { createBoundaryRuleKit } from "./boundary-rule-kit.ts";
import type { Suppressor } from "../../contracts/suppress";

type Kit = ReturnType<typeof createBoundaryRuleKit>;

const RULE_ID = "boundary/public-surface-cap";
const MAX_PUBLIC_EXPORTS = 7;

function messageFor(count: number): string {
  return `Slice's public entry exports ${count} symbols, exceeding the ` +
    `cap of ${MAX_PUBLIC_EXPORTS}. A wide index.ts quietly re-opens the ` +
    "boundary deep-import closes.";
}

/**
 * A per-file AST check, not a graph one: `fsd.role === "index"` already
 * names a slice's own public entry, so counting its top-level exports needs
 * no cross-file knowledge -- unlike `slice-fan-out-cap`, its sibling.
 */
export function createPublicSurfaceCapRule(
  kit: Kit,
  suppressor: Suppressor,
): Deno.lint.Rule {
  return {
    create(context) {
      return kit.forKnownFiles(context, (fsd) => ({
        Program(node) {
          if (fsd.role !== "index") return;
          const count = countProgramExports(node.body);
          if (count <= MAX_PUBLIC_EXPORTS) return;
          kit.reportAtNode({
            context,
            suppressor,
            ruleId: RULE_ID,
            node,
            message: messageFor(count),
          });
        },
      }));
    },
  };
}
