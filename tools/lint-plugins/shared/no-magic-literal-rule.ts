import { classify } from "./fsd-path.ts";
import type { createSemanticsRuleKit } from "./semantics-rule-kit.ts";
import type { Suppressor } from "../../contracts/suppress";

type Kit = ReturnType<typeof createSemanticsRuleKit>;

const RULE_ID = "semantics/no-magic-literal";
const MESSAGE = "Magic literal in entity/model code. Name it as a constant " +
  "so the value's meaning is documented once.";

const ENTITY_OR_MODEL = /\/(entities|model)\//;
const CONSTANT_NAME = /^[A-Z][A-Z0-9_]*$/;

function isSmallAllowedNumber(value: unknown): boolean {
  return value === 0 || value === 1;
}

/** The six values every rule instance allows unconditionally. */
function isAllowedPrimitive(value: unknown): boolean {
  return isSmallAllowedNumber(value) || value === "" || value === true ||
    value === false;
}

/** `-1` parses as `UnaryExpression(-, Literal(1))`, not a single literal node. */
function isNegativeOne(node: Deno.lint.Literal): boolean {
  const parent = node.parent;
  if (parent.type !== "UnaryExpression") return false;
  return parent.operator === "-" && node.value === 1;
}

function isArrayIndexAccess(node: Deno.lint.Literal): boolean {
  const parent = node.parent;
  if (parent.type !== "MemberExpression") return false;
  return parent.computed && parent.property === node;
}

function memberPropertyName(node: Deno.lint.Node): string | null {
  if (node.type !== "MemberExpression") return null;
  return node.property.type === "Identifier" ? node.property.name : null;
}

/** `slice(0, 1)`-style positional arguments are allowed wherever they occur. */
function isSliceLikeArgument(node: Deno.lint.Literal): boolean {
  const parent = node.parent;
  if (parent.type !== "CallExpression") return false;
  return memberPropertyName(parent.callee) === "slice";
}

function isNamedConstantDeclaration(node: Deno.lint.Literal): boolean {
  const parent = node.parent;
  if (parent.type !== "VariableDeclarator" || parent.init !== node) {
    return false;
  }
  return parent.id.type === "Identifier" && CONSTANT_NAME.test(parent.id.name);
}

/** A module specifier string names a module, not a domain value -- it is never "magic". */
function isModuleSpecifier(node: Deno.lint.Literal): boolean {
  const parent = node.parent;
  if (parent.type === "ImportDeclaration") return parent.source === node;
  if (parent.type === "ExportAllDeclaration") return parent.source === node;
  return parent.type === "ExportNamedDeclaration" && parent.source === node;
}

const ALLOWANCES: readonly ((node: Deno.lint.Literal) => boolean)[] = [
  (node) => isAllowedPrimitive(node.value),
  isNegativeOne,
  isArrayIndexAccess,
  isSliceLikeArgument,
  isNamedConstantDeclaration,
  isModuleSpecifier,
];

function isAllowed(node: Deno.lint.Literal): boolean {
  return node.parent.type === "TSLiteralType" ||
    ALLOWANCES.some((allowance) => allowance(node));
}

/**
 * A test file's literal IS the specification: `assertEquals(count, 3)`
 * states the expected value independently of the code under test.
 * Replacing the `3` with a constant imported from that code would make the
 * assertion tautological -- it could no longer catch a wrong constant.
 * Recorded in docs/GOVERNANCE.md under Tier 2 no-magic-literal.
 * `classify().role` is the sole test used here, per fsd-path.ts's existing
 * role computation.
 */
function isInScope(filename: string): boolean {
  return ENTITY_OR_MODEL.test(filename) && classify(filename).role !== "test";
}

export function createNoMagicLiteralRule(
  kit: Kit,
  suppressor: Suppressor,
): Deno.lint.Rule {
  return {
    create(context) {
      return kit.forKnownFiles(context, () => {
        if (!isInScope(context.filename)) return {};
        return {
          Literal(node) {
            if (isAllowed(node)) return;
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
