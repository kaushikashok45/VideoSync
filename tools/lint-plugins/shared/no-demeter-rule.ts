import type { createSemanticsRuleKit } from "./semantics-rule-kit.ts";
import type { createEntityOriginTracker } from "./entity-origin.ts";
import type { Suppressor } from "../../contracts/suppress";

type Kit = ReturnType<typeof createSemanticsRuleKit>;
type Tracker = ReturnType<typeof createEntityOriginTracker>;

const RULE_ID = "semantics/no-demeter";
const MESSAGE = "Member-access chain reaches through an imported module you " +
  "do not own (a.b.c). Ask the module for what you need instead of " +
  "walking into it.";

/** Only the outermost node of a chain is visited; inner links are its object. */
function isChainRoot(node: Deno.lint.MemberExpression): boolean {
  const parent = node.parent;
  return !(parent.type === "MemberExpression" && parent.object === node);
}

interface Chain {
  readonly linkCount: number;
  readonly root: Deno.lint.Expression;
}

function chainOf(node: Deno.lint.MemberExpression): Chain {
  let current: Deno.lint.Expression = node;
  let linkCount = 0;
  while (current.type === "MemberExpression") {
    linkCount++;
    current = current.object;
  }
  return { linkCount, root: current };
}

/** `linkCount > 1` is the `a.b.c` shape; only an `Identifier` root can be resolved to an import. */
function isForeignChain(
  tracker: Tracker,
  context: Deno.lint.RuleContext,
  chain: Chain,
): boolean {
  if (chain.linkCount <= 1 || chain.root.type !== "Identifier") return false;
  return tracker.originOf(context, chain.root.name) !== null;
}

export function createNoDemeterRule(
  kit: Kit,
  suppressor: Suppressor,
  tracker: Tracker,
): Deno.lint.Rule {
  return {
    create(context) {
      return kit.forKnownFiles(context, () => ({
        MemberExpression(node) {
          if (!isChainRoot(node)) return;
          if (!isForeignChain(tracker, context, chainOf(node))) return;
          kit.reportAtNode({
            context,
            suppressor,
            ruleId: RULE_ID,
            node,
            message: MESSAGE,
          });
        },
      }));
    },
  };
}
