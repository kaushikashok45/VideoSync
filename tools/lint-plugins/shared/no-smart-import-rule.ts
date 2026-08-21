import { classify } from "./fsd-path.ts";
import { createDumbUiRuleKit } from "./dumb-ui-rule-kit.ts";
import { presentationImportScope } from "./presentation-import-scope.ts";
import type { Suppressor } from "../../contracts/suppress";
import type { FsdPath } from "../../contracts/fsd-path";
import type { ResolvedSpecifier } from "../../contracts/specifier-resolve";

type Kit = ReturnType<typeof createDumbUiRuleKit>;

interface Resolver {
  resolve(raw: string, fromFile: string): ResolvedSpecifier;
}

const RULE_ID = "dumb-ui/no-smart-import";

/** The framework and allow-listed pure-presentation npm/jsr packages. */
const ALLOWED_BARE_NAMES = new Set([
  "react",
  "react-dom",
  "react-router",
  "react-router-dom",
  "lucide-react",
  "sonner",
]);

/** Anywhere in the raw specifier -- catches a store import even when resolution fails. */
const STORE_PATTERN = /store/i;

const MESSAGE = "Presentation may import only react/react-dom/react-router, " +
  "app/shared/ui-kit, its own slice's contracts/, sibling presentation " +
  "files in the same slice, and the allow-listed presentation libraries.";

function underUiKit(absolutePath: string, repoRoot: string): boolean {
  return absolutePath.startsWith(`${repoRoot}/app/shared/ui-kit/`);
}

/** Bundles `violation`'s inputs so it stays within the ≤4-param budget it itself enforces. */
interface ViolationCtx {
  readonly source: FsdPath;
  readonly raw: string;
  readonly resolved: ResolvedSpecifier;
  readonly repoRoot: string;
  readonly sourceFile: string;
}

function allowedBareImport(resolved: ResolvedSpecifier): boolean {
  return resolved.kind === "bare" &&
    ALLOWED_BARE_NAMES.has(resolved.bareName ?? "");
}

function violationForResolved(
  absolutePath: string,
  ctx: ViolationCtx,
): string | null {
  if (underUiKit(absolutePath, ctx.repoRoot)) return null;
  const target = classify(absolutePath);
  const scope = presentationImportScope(
    ctx.source,
    target,
    ctx.sourceFile,
    absolutePath,
  );
  return scope.isOwnContracts || scope.isSiblingPresentation ? null : MESSAGE;
}

function violation(ctx: ViolationCtx): string | null {
  if (STORE_PATTERN.test(ctx.raw)) return MESSAGE;
  const absolutePath = ctx.resolved.absolutePath;
  if (absolutePath === null) {
    return allowedBareImport(ctx.resolved) ? null : MESSAGE;
  }
  return violationForResolved(absolutePath, ctx);
}

interface RuleDeps {
  readonly kit: Kit;
  readonly resolver: Resolver;
  readonly suppressor: Suppressor;
  readonly repoRoot: string;
}

function handleImportDeclaration(
  deps: RuleDeps,
  context: Deno.lint.RuleContext,
  source: FsdPath,
  node: Deno.lint.ImportDeclaration,
): void {
  const raw = node.source.value;
  const resolved = deps.resolver.resolve(raw, context.filename);
  const message = violation({
    source,
    raw,
    resolved,
    repoRoot: deps.repoRoot,
    sourceFile: context.filename,
  });
  if (message === null) return;
  deps.kit.reportAtNode({
    context,
    suppressor: deps.suppressor,
    ruleId: RULE_ID,
    node,
    message,
  });
}

function checkImportDeclaration(
  deps: RuleDeps,
  context: Deno.lint.RuleContext,
  source: FsdPath,
): Deno.lint.LintVisitor {
  return {
    ImportDeclaration: (node) =>
      handleImportDeclaration(deps, context, source, node),
  };
}

/** ARCH-002: presentation is props-only -- no store/model/api/entities/lib import. */
export function createNoSmartImportRule(
  kit: Kit,
  resolver: Resolver,
  suppressor: Suppressor,
  repoRoot: string,
): Deno.lint.Rule {
  const deps: RuleDeps = { kit, resolver, suppressor, repoRoot };
  return {
    create(context) {
      return kit.forPresentationFiles(
        context,
        (source) => checkImportDeclaration(deps, context, source),
      );
    },
  };
}
