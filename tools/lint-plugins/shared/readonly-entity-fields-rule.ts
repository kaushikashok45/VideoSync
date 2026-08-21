import type { createSemanticsRuleKit } from "./semantics-rule-kit.ts";
import type { Suppressor } from "../../contracts/suppress";

type Kit = ReturnType<typeof createSemanticsRuleKit>;

const RULE_ID = "semantics/readonly-entity-fields";
const MESSAGE =
  "Entity/model fields must be readonly. Mutation belongs to the layer " +
  "that owns the data, not the shape that describes it.";

const ENTITY_OR_MODEL_DIR = /\/(entities|model)\//;

function inScope(absolutePath: string): boolean {
  return ENTITY_OR_MODEL_DIR.test(absolutePath);
}

function isPropertySignature(
  member: { type: string },
): member is Deno.lint.TSPropertySignature {
  return member.type === "TSPropertySignature";
}

/**
 * Only `TSPropertySignature` is checked. `TSMethodSignature` and
 * `TSIndexSignature` members are a documented blind spot: a method on an
 * entity interface is unusual but not impossible, and this rule does not
 * attempt to judge it.
 */
function reportUnlessReadonly(
  kit: Kit,
  suppressor: Suppressor,
  context: Deno.lint.RuleContext,
  properties: readonly Deno.lint.TSPropertySignature[],
): void {
  for (const property of properties) {
    if (property.readonly) continue;
    kit.reportAtNode({
      context,
      suppressor,
      ruleId: RULE_ID,
      node: property,
      message: MESSAGE,
    });
  }
}

export function createReadonlyEntityFieldsRule(
  kit: Kit,
  suppressor: Suppressor,
): Deno.lint.Rule {
  return {
    create(context) {
      return kit.forKnownFiles(context, () => {
        if (!inScope(context.filename)) return {};
        return {
          TSInterfaceDeclaration(node) {
            const props = node.body.body.filter(isPropertySignature);
            reportUnlessReadonly(kit, suppressor, context, props);
          },
          TSTypeAliasDeclaration(node) {
            if (node.typeAnnotation.type !== "TSTypeLiteral") return;
            const props = node.typeAnnotation.members.filter(
              isPropertySignature,
            );
            reportUnlessReadonly(kit, suppressor, context, props);
          },
        };
      });
    },
  };
}
