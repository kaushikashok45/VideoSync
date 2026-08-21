import type { createSemanticsRuleKit } from "./semantics-rule-kit.ts";
import type { Suppressor } from "../../contracts/suppress";

type Kit = ReturnType<typeof createSemanticsRuleKit>;

const RULE_ID = "semantics/no-console";
const MESSAGE = "console.* is banned outside server/shared/logger. Go " +
  "through the shared logger so output stays structured and testable.";

/**
 * `server/shared/logger/` defers to the structured logger; `tools/cli/`
 * is the other legitimate exemption -- a CLI's stdout is its program output
 * contract, not ad-hoc logging. `plugin-check-runner.ts` prints the report a
 * human reads and `check-*.test.ts` asserts on, and routing that through a
 * JSON logger would corrupt the format under test. The rest of `tools/**`,
 * including `tools/lint-plugins/**`, is deliberately NOT exempted: a
 * `console.log` inside a lint plugin is ordinary debug residue.
 */
const EXEMPT_DIR = /\/server\/shared\/logger\/|\/tools\/cli\//;

function isConsoleCallee(callee: Deno.lint.Expression): boolean {
  if (callee.type !== "MemberExpression") return false;
  return callee.object.type === "Identifier" &&
    callee.object.name === "console";
}

export function createNoConsoleRule(
  kit: Kit,
  suppressor: Suppressor,
): Deno.lint.Rule {
  return {
    create(context) {
      return kit.forKnownFiles(context, () => {
        if (EXEMPT_DIR.test(context.filename)) return {};
        return {
          CallExpression(node) {
            if (!isConsoleCallee(node.callee)) return;
            kit.reportAtNode({
              context,
              suppressor,
              ruleId: RULE_ID,
              node,
              message: MESSAGE,
            });
          },
        };
      });
    },
  };
}
