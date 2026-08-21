import type { createSemanticsRuleKit } from "./semantics-rule-kit.ts";
import type { Suppressor } from "../../contracts/suppress";
import type { RangedNode } from "../../contracts/semantics-report";

type Kit = ReturnType<typeof createSemanticsRuleKit>;

interface ReporterArgs {
  readonly kit: Kit;
  readonly suppressor: Suppressor;
  readonly context: Deno.lint.RuleContext;
  readonly ruleId: string;
}

/**
 * Curries a rule's fixed reporting fields (`kit`, `suppressor`, `context`,
 * `ruleId`) so each visitor call site only supplies what it actually found:
 * the node and the message. Keeps per-site call expressions short enough
 * that a rule with multiple report sites stays under structural/body-length
 * without inlining `kit.reportAtNode`'s five-field object at every site.
 */
export function createNodeReporter(
  args: ReporterArgs,
): (node: RangedNode, message: string) => void {
  return (node, message) =>
    args.kit.reportAtNode({
      context: args.context,
      suppressor: args.suppressor,
      ruleId: args.ruleId,
      node,
      message,
    });
}
