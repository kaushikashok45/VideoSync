import type { createSemanticsRuleKit } from "./semantics-rule-kit.ts";
import type { Suppressor } from "../../contracts/suppress";

type Kit = ReturnType<typeof createSemanticsRuleKit>;

const RULE_ID = "semantics/no-swallowed-error";
const MESSAGE = "catch block neither rethrows nor reports the error -- " +
  "it silently disappears.";

/**
 * Only the catch body's direct statements are inspected -- a documented
 * blind spot. A rethrow or report nested inside an `if` inside the catch is
 * not recognised, since walking arbitrary depth risks false negatives
 * turning into false confidence about what actually ran.
 */
function rethrowsOrReports(body: Deno.lint.BlockStatement): boolean {
  return body.body.some((statement) =>
    statement.type === "ThrowStatement" ||
    (statement.type === "ExpressionStatement" &&
      statement.expression.type === "CallExpression")
  );
}

export function createNoSwallowedErrorRule(
  kit: Kit,
  suppressor: Suppressor,
): Deno.lint.Rule {
  return {
    create(context) {
      return kit.forKnownFiles(context, () => ({
        CatchClause(node) {
          if (rethrowsOrReports(node.body)) return;
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
