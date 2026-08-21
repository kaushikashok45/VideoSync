import type { createSemanticsRuleKit } from "./semantics-rule-kit.ts";
import type { createEntityOriginTracker } from "./entity-origin.ts";
import type { Suppressor } from "../../contracts/suppress";

type Kit = ReturnType<typeof createSemanticsRuleKit>;
type Tracker = ReturnType<typeof createEntityOriginTracker>;

const RULE_ID = "semantics/no-foreign-switch";
const MESSAGE = "Switching on an imported entity's member forces every " +
  "consumer to be edited when a variant is added. Let the entity dispatch " +
  "(a method or a lookup on the entity itself).";

const ENTITY_OR_MODEL = /\/(entities|model)\//;

function rootIdentifier(
  node: Deno.lint.Expression,
): Deno.lint.Identifier | null {
  let current = node;
  while (current.type === "MemberExpression") current = current.object;
  return current.type === "Identifier" ? current : null;
}

function isForeignEntityMember(
  tracker: Tracker,
  context: Deno.lint.RuleContext,
  node: Deno.lint.Expression,
): boolean {
  if (node.type !== "MemberExpression") return false;
  const root = rootIdentifier(node);
  if (root === null) return false;
  const origin = tracker.originOf(context, root.name);
  return origin !== null && ENTITY_OR_MODEL.test(origin);
}

export function createNoForeignSwitchRule(
  kit: Kit,
  suppressor: Suppressor,
  tracker: Tracker,
): Deno.lint.Rule {
  return {
    create(context) {
      return kit.forKnownFiles(context, () => ({
        SwitchStatement(node) {
          if (!isForeignEntityMember(tracker, context, node.discriminant)) {
            return;
          }
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
