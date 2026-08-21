import type { createSemanticsRuleKit } from "./semantics-rule-kit.ts";
import type { createResolver } from "./specifier-resolve.ts";
import { createNodeReporter } from "./node-reporter.ts";
import type { Suppressor } from "../../contracts/suppress";

type Kit = ReturnType<typeof createSemanticsRuleKit>;
type Resolver = ReturnType<typeof createResolver>;

const RULE_ID = "semantics/no-concrete-transport-in-domain";
const MESSAGE = "Domain code may not name a concrete transport. Depend on " +
  "an injected port; only api/** or shared/api/** may import this.";

const BANNED_BARE_NAMES = new Set([
  "socket.io",
  "socket.io-client",
  "simple-peer",
  "express",
]);
const DOMAIN_DIR = /\/(entities|model|lib)\//;

/** Scoped to the domain layer named in GOVERNANCE.md's D rule; api/** never matches this pattern. */
function isDomainCode(absolutePath: string): boolean {
  return DOMAIN_DIR.test(absolutePath);
}

function checkImport(
  deps: { resolver: Resolver; context: Deno.lint.RuleContext },
  report: (node: Deno.lint.ImportDeclaration, message: string) => void,
  node: Deno.lint.ImportDeclaration,
): void {
  const resolved = deps.resolver.resolve(
    node.source.value,
    deps.context.filename,
  );
  if (resolved.bareName === null) return;
  if (!BANNED_BARE_NAMES.has(resolved.bareName)) return;
  report(node, MESSAGE);
}

function buildVisitor(
  deps: { kit: Kit; suppressor: Suppressor; resolver: Resolver },
  context: Deno.lint.RuleContext,
): Deno.lint.LintVisitor {
  return deps.kit.forKnownFiles(context, () => {
    if (!isDomainCode(context.filename)) return {};
    const report = createNodeReporter({
      kit: deps.kit,
      suppressor: deps.suppressor,
      context,
      ruleId: RULE_ID,
    });
    return {
      ImportDeclaration: (node) =>
        checkImport({ resolver: deps.resolver, context }, report, node),
    };
  });
}

export function createNoConcreteTransportRule(
  kit: Kit,
  suppressor: Suppressor,
  resolver: Resolver,
): Deno.lint.Rule {
  const deps = { kit, suppressor, resolver };
  return { create: (context) => buildVisitor(deps, context) };
}
