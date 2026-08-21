import type { createSemanticsRuleKit } from "./semantics-rule-kit.ts";
import type { Suppressor } from "../../contracts/suppress";

type Kit = ReturnType<typeof createSemanticsRuleKit>;

const RULE_ID = "semantics/no-empty-names";
const MESSAGE = "Identifier name carries no meaning. Name it for what it " +
  "holds, not its shape.";

const BANNED_NAMES = new Set([
  "data",
  "info",
  "item",
  "obj",
  "temp",
  "val",
  "res",
  "ret",
  "stuff",
  "thing",
  "helper",
  "util",
  "manager",
  "handler",
]);

/** Bundles the plugin-wide collaborators so per-node checks stay within the ≤4-param budget this rule itself enforces. */
interface Deps {
  readonly kit: Kit;
  readonly suppressor: Suppressor;
  readonly context: Deno.lint.RuleContext;
}

function isEmptyName(name: string): boolean {
  return BANNED_NAMES.has(name) || name.length === 1;
}

/** A single-letter name is only tolerated as the counter a for/for-of/for-in loop declares. */
function isLoopDeclarationHead(
  declaration: Deno.lint.VariableDeclaration,
): boolean {
  const parent = declaration.parent;
  if (parent.type === "ForStatement") return parent.init === declaration;
  if (parent.type === "ForOfStatement" || parent.type === "ForInStatement") {
    return parent.left === declaration;
  }
  return false;
}

function report(
  deps: Deps,
  node: { readonly range: readonly [number, number] },
): void {
  deps.kit.reportAtNode({
    context: deps.context,
    suppressor: deps.suppressor,
    ruleId: RULE_ID,
    node,
    message: MESSAGE,
  });
}

function checkDeclarator(
  deps: Deps,
  declaration: Deno.lint.VariableDeclaration,
  id: Deno.lint.Identifier,
): void {
  if (!isEmptyName(id.name)) return;
  if (id.name.length === 1 && isLoopDeclarationHead(declaration)) return;
  report(deps, id);
}

function checkVariableDeclaration(
  deps: Deps,
  node: Deno.lint.VariableDeclaration,
): void {
  for (const decl of node.declarations) {
    if (decl.id.type === "Identifier") checkDeclarator(deps, node, decl.id);
  }
}

function checkParams(
  deps: Deps,
  params: readonly Deno.lint.Parameter[],
): void {
  for (const param of params) {
    if (param.type !== "Identifier") continue;
    if (isEmptyName(param.name)) report(deps, param);
  }
}

/**
 * Only direct `Identifier` bindings are checked -- destructured, rest, and
 * catch-clause patterns are a documented blind spot, since naming quality
 * inside a pattern is not reliably judged from the AST shape alone.
 */
export function createNoEmptyNamesRule(
  kit: Kit,
  suppressor: Suppressor,
): Deno.lint.Rule {
  return {
    create(context) {
      const deps: Deps = { kit, suppressor, context };
      return kit.forKnownFiles(context, () => ({
        VariableDeclaration(node) {
          checkVariableDeclaration(deps, node);
        },
        FunctionDeclaration(node) {
          checkParams(deps, node.params);
        },
        FunctionExpression(node) {
          checkParams(deps, node.params);
        },
        ArrowFunctionExpression(node) {
          checkParams(deps, node.params);
        },
      }));
    },
  };
}
