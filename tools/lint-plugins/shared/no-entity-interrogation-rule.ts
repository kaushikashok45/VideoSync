import type { createSemanticsRuleKit } from "./semantics-rule-kit.ts";
import type { createEntityOriginTracker } from "./entity-origin.ts";
import type { Suppressor } from "../../contracts/suppress";

type Kit = ReturnType<typeof createSemanticsRuleKit>;
type Tracker = ReturnType<typeof createEntityOriginTracker>;

const RULE_ID = "semantics/no-entity-interrogation";
const MESSAGE = "Comparing an imported entity/model member against a " +
  "literal asks it for its state. Add a predicate or behaviour method on " +
  "the entity instead (Tell, Don't Ask).";

const COMPARISON_OPERATORS = new Set(["===", "!==", "==", "!="]);
const ENTITY_OR_MODEL = /\/(entities|model)\//;

function rootIdentifier(
  node: Deno.lint.Expression | Deno.lint.PrivateIdentifier,
): Deno.lint.Identifier | null {
  let current = node;
  while (current.type === "MemberExpression") current = current.object;
  return current.type === "Identifier" ? current : null;
}

function isForeignEntityMember(
  tracker: Tracker,
  context: Deno.lint.RuleContext,
  node: Deno.lint.Expression | Deno.lint.PrivateIdentifier,
): boolean {
  if (node.type !== "MemberExpression") return false;
  const root = rootIdentifier(node);
  if (root === null) return false;
  const origin = tracker.originOf(context, root.name);
  return origin !== null && ENTITY_OR_MODEL.test(origin);
}

type Operand = Deno.lint.Expression | Deno.lint.PrivateIdentifier;

function matchesEntityAgainstLiteral(
  tracker: Tracker,
  context: Deno.lint.RuleContext,
  member: Operand,
  other: Operand,
): boolean {
  if (!isForeignEntityMember(tracker, context, member)) return false;
  return other.type === "Literal";
}

function isEntityLiteralComparison(
  tracker: Tracker,
  context: Deno.lint.RuleContext,
  node: Deno.lint.BinaryExpression,
): boolean {
  if (!COMPARISON_OPERATORS.has(node.operator)) return false;
  return matchesEntityAgainstLiteral(tracker, context, node.left, node.right) ||
    matchesEntityAgainstLiteral(tracker, context, node.right, node.left);
}

export function createNoEntityInterrogationRule(
  kit: Kit,
  suppressor: Suppressor,
  tracker: Tracker,
): Deno.lint.Rule {
  return {
    create(context) {
      return kit.forKnownFiles(context, () => ({
        BinaryExpression(node) {
          if (!isEntityLiteralComparison(tracker, context, node)) return;
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
