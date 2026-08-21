import type { createSemanticsRuleKit } from "./semantics-rule-kit.ts";
import type { Suppressor } from "../../contracts/suppress";

type Kit = ReturnType<typeof createSemanticsRuleKit>;

const RULE_ID = "semantics/no-stub-override";
const MESSAGE = "override member's body is only a throw. A subclass that " +
  "cannot honour the base contract is not substitutable (LSP).";

function isThrowOnlyBody(body: Deno.lint.BlockStatement): boolean {
  return body.body.length === 1 && body.body[0].type === "ThrowStatement";
}

export function createNoStubOverrideRule(
  kit: Kit,
  suppressor: Suppressor,
): Deno.lint.Rule {
  return {
    create(context) {
      return kit.forKnownFiles(context, () => ({
        MethodDefinition(node) {
          if (!node.override) return;
          if (node.value.type !== "FunctionExpression") return;
          if (!isThrowOnlyBody(node.value.body)) return;
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
