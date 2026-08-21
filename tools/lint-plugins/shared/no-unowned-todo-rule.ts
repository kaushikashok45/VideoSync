import type { createSemanticsRuleKit } from "./semantics-rule-kit.ts";
import type { Suppressor } from "../../contracts/suppress";

type Kit = ReturnType<typeof createSemanticsRuleKit>;

const RULE_ID = "semantics/no-unowned-todo";
const MESSAGE = "TODO has no owner and reference. Use " +
  "`TODO(owner): description (#123 or a URL)` so it is actionable.";

const TODO_PATTERN = /TODO/;
const OWNER_PATTERN = /TODO\([\w.-]+\)/;
const REFERENCE_PATTERN = /(#\d+|https?:\/\/\S+)/;

function isCompliant(commentText: string): boolean {
  return OWNER_PATTERN.test(commentText) && REFERENCE_PATTERN.test(commentText);
}

export function createNoUnownedTodoRule(
  kit: Kit,
  suppressor: Suppressor,
): Deno.lint.Rule {
  return {
    create(context) {
      return kit.forKnownFiles(context, () => ({
        Program() {
          for (const comment of context.sourceCode.getAllComments()) {
            if (!TODO_PATTERN.test(comment.value)) continue;
            if (isCompliant(comment.value)) continue;
            kit.reportAtNode({
              context,
              suppressor,
              ruleId: RULE_ID,
              node: comment,
              message: MESSAGE,
            });
          }
        },
      }));
    },
  };
}
