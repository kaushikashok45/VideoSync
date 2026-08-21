import { loadSuppressor } from "./shared/suppress.ts";
import { createSemanticsRuleKit } from "./shared/semantics-rule-kit.ts";
import { createResolver } from "./shared/specifier-resolve.ts";
import { createEntityOriginTracker } from "./shared/entity-origin.ts";
import { createOnePublicExportRule } from "./shared/one-public-export-rule.ts";
import { createReadonlyEntityFieldsRule } from "./shared/readonly-entity-fields-rule.ts";
import { createBrandedIdsRule } from "./shared/branded-ids-rule.ts";
import { createNoDefaultExportRule } from "./shared/no-default-export-rule.ts";
import { createNoEmptyNamesRule } from "./shared/no-empty-names-rule.ts";
import { createNoDemeterRule } from "./shared/no-demeter-rule.ts";
import { createNoEntityInterrogationRule } from "./shared/no-entity-interrogation-rule.ts";
import { createNoForeignSwitchRule } from "./shared/no-foreign-switch-rule.ts";
import { createNoConcreteTransportRule } from "./shared/no-concrete-transport-rule.ts";
import { createNoStubOverrideRule } from "./shared/no-stub-override-rule.ts";
import { createNoSwallowedErrorRule } from "./shared/no-swallowed-error-rule.ts";
import { createNoMagicLiteralRule } from "./shared/no-magic-literal-rule.ts";
import { createNoLooseAssertionRule } from "./shared/no-loose-assertion-rule.ts";
import { createNoUnownedTodoRule } from "./shared/no-unowned-todo-rule.ts";
import { createNoConsoleRule } from "./shared/no-console-rule.ts";

interface Collaborators {
  readonly kit: ReturnType<typeof createSemanticsRuleKit>;
  readonly suppressor: ReturnType<typeof loadSuppressor>;
  readonly repoRoot: string;
  readonly resolver: ReturnType<typeof createResolver>;
  readonly tracker: ReturnType<typeof createEntityOriginTracker>;
}

function buildDeclarationShapeRules(
  collaborators: Collaborators,
): Record<string, Deno.lint.Rule> {
  const { kit, suppressor, repoRoot } = collaborators;
  return {
    "one-public-export": createOnePublicExportRule(kit, suppressor),
    "readonly-entity-fields": createReadonlyEntityFieldsRule(kit, suppressor),
    "branded-ids": createBrandedIdsRule(kit, suppressor),
    "no-default-export": createNoDefaultExportRule(kit, suppressor, repoRoot),
    "no-empty-names": createNoEmptyNamesRule(kit, suppressor),
  };
}

/** The three rules that share `entity-origin`'s once-per-file import walk, plus the transport rule that shares its resolver. */
function buildForeignOriginRules(
  collaborators: Collaborators,
): Record<string, Deno.lint.Rule> {
  const { kit, suppressor, tracker, resolver } = collaborators;
  return {
    "no-demeter": createNoDemeterRule(kit, suppressor, tracker),
    "no-entity-interrogation": createNoEntityInterrogationRule(
      kit,
      suppressor,
      tracker,
    ),
    "no-foreign-switch": createNoForeignSwitchRule(kit, suppressor, tracker),
    "no-concrete-transport-in-domain": createNoConcreteTransportRule(
      kit,
      suppressor,
      resolver,
    ),
  };
}

/** The six resolution-independent Tier 2 rules: no shared collaborator beyond `kit`/`suppressor`. */
function buildAntiSlopRules(
  collaborators: Collaborators,
): Record<string, Deno.lint.Rule> {
  const { kit, suppressor } = collaborators;
  return {
    "no-stub-override": createNoStubOverrideRule(kit, suppressor),
    "no-swallowed-error": createNoSwallowedErrorRule(kit, suppressor),
    "no-magic-literal": createNoMagicLiteralRule(kit, suppressor),
    "no-loose-assertion": createNoLooseAssertionRule(kit, suppressor),
    "no-unowned-todo": createNoUnownedTodoRule(kit, suppressor),
    "no-console": createNoConsoleRule(kit, suppressor),
  };
}

function buildRules(
  collaborators: Collaborators,
): Record<string, Deno.lint.Rule> {
  return {
    ...buildDeclarationShapeRules(collaborators),
    ...buildForeignOriginRules(collaborators),
    ...buildAntiSlopRules(collaborators),
  };
}

/**
 * Declaration-shape rules (commit 5) plus the ten resolution-dependent
 * rules (commit 6): Tell-Don't-Ask proxies, the remaining SOLID proxies,
 * transport isolation, and the anti-slop checks. No type information exists
 * in the lint AST, so each rule module documents its own blind spot rather
 * than pretending to more coverage than it has. Not registered in
 * `deno.json` -> `lint.plugins` yet; commit 7 registers it alongside the
 * baseline seed, once every rule has been swept over `tools/**` itself.
 * Exercised only via `Deno.lint.runPlugin` until then.
 */
export function createSemanticsPlugin(repoRoot: string): Deno.lint.Plugin {
  const resolver = createResolver(`${repoRoot}/deno.json`);
  const collaborators: Collaborators = {
    suppressor: loadSuppressor(`${repoRoot}/tools/baseline/baseline.json`),
    kit: createSemanticsRuleKit(repoRoot),
    repoRoot,
    resolver,
    tracker: createEntityOriginTracker(resolver),
  };
  return { name: "semantics", rules: buildRules(collaborators) };
}
