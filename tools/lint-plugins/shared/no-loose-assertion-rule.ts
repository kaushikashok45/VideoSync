import type { createSemanticsRuleKit } from "./semantics-rule-kit.ts";
import { createNodeReporter } from "./node-reporter.ts";
import type { Suppressor } from "../../contracts/suppress";

type Kit = ReturnType<typeof createSemanticsRuleKit>;

const RULE_ID = "semantics/no-loose-assertion";
const AS_MESSAGE = "`as` cast bypasses the type checker. Narrow with a " +
  "real check instead, outside the api/** parse boundary.";
const BANG_MESSAGE = "Non-null `!` assertion bypasses the type checker. " +
  "Narrow with a real check instead, outside the api/** parse boundary.";

const API_DIR = /\/api\//;

/** `api/**` is the one place external data legitimately enters and needs parsing/narrowing at the boundary. */
function isParseBoundary(absolutePath: string): boolean {
  return API_DIR.test(absolutePath);
}

function buildVisitor(
  kit: Kit,
  suppressor: Suppressor,
  context: Deno.lint.RuleContext,
): Deno.lint.LintVisitor {
  return kit.forKnownFiles(context, () => {
    if (isParseBoundary(context.filename)) return {};
    const report = createNodeReporter({
      kit,
      suppressor,
      context,
      ruleId: RULE_ID,
    });
    return {
      TSAsExpression(node) {
        report(node, AS_MESSAGE);
      },
      TSNonNullExpression(node) {
        report(node, BANG_MESSAGE);
      },
    };
  });
}

export function createNoLooseAssertionRule(
  kit: Kit,
  suppressor: Suppressor,
): Deno.lint.Rule {
  return { create: (context) => buildVisitor(kit, suppressor, context) };
}
