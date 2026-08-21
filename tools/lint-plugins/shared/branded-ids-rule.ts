import type { createSemanticsRuleKit } from "./semantics-rule-kit.ts";
import type { Suppressor } from "../../contracts/suppress";

type Kit = ReturnType<typeof createSemanticsRuleKit>;

const RULE_ID = "semantics/branded-ids";
const MESSAGE =
  "Id/Code/Key fields need a branded (nominal) type, not a bare " +
  "string/number -- otherwise any string can be handed to any id.";

const ENTITIES_OR_ROOT_CONTRACTS = /\/(entities|shared\/contracts)\//;
const ID_LIKE_NAME = /(Id|Code|Key)$/;

function inScope(absolutePath: string): boolean {
  return ENTITIES_OR_ROOT_CONTRACTS.test(absolutePath);
}

function keyName(
  key: Deno.lint.TSPropertySignature["key"],
): string | null {
  if (key.type === "Identifier") return key.name;
  // `StringLiteral`'s AST `type` tag is actually `"Literal"` (ESTree
  // convention); `value` narrows to `string` only after this check.
  if (key.type === "Literal" && typeof key.value === "string") {
    return key.value;
  }
  return null;
}

/**
 * Only the two primitive keywords are flagged, because the lint AST carries
 * no type information: a type alias that merely *renames* `string` (`type
 * RoomId = string`) is indistinguishable from a real brand at this level.
 * That gap is `reviewer-architecture`'s job (Tier 3), not this rule's.
 */
function isBarePrimitive(
  typeAnnotation: Deno.lint.TSPropertySignature["typeAnnotation"],
): boolean {
  if (typeAnnotation === undefined) return false;
  const inner = typeAnnotation.typeAnnotation.type;
  return inner === "TSStringKeyword" || inner === "TSNumberKeyword";
}

function isIdLikeUnbranded(property: Deno.lint.TSPropertySignature): boolean {
  const name = keyName(property.key);
  return name !== null && ID_LIKE_NAME.test(name) &&
    isBarePrimitive(property.typeAnnotation);
}

function isPropertySignature(
  member: { type: string },
): member is Deno.lint.TSPropertySignature {
  return member.type === "TSPropertySignature";
}

function reportIfUnbranded(
  kit: Kit,
  suppressor: Suppressor,
  context: Deno.lint.RuleContext,
  properties: readonly Deno.lint.TSPropertySignature[],
): void {
  for (const property of properties) {
    if (!isIdLikeUnbranded(property)) continue;
    kit.reportAtNode({
      context,
      suppressor,
      ruleId: RULE_ID,
      node: property,
      message: MESSAGE,
    });
  }
}

export function createBrandedIdsRule(
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
            reportIfUnbranded(kit, suppressor, context, props);
          },
          TSTypeAliasDeclaration(node) {
            if (node.typeAnnotation.type !== "TSTypeLiteral") return;
            const props = node.typeAnnotation.members.filter(
              isPropertySignature,
            );
            reportIfUnbranded(kit, suppressor, context, props);
          },
        };
      });
    },
  };
}
