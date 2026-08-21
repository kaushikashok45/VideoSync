import { createBoundaryRuleKit } from "./boundary-rule-kit.ts";
import { resolveImportTarget } from "./import-target.ts";
import type { Suppressor } from "../../contracts/suppress";
import type { FsdPath } from "../../contracts/fsd-path";

type Kit = ReturnType<typeof createBoundaryRuleKit>;

interface Resolver {
  resolve(raw: string, fromFile: string): { absolutePath: string | null };
}

type ImportCheck = (source: FsdPath, target: FsdPath) => string | null;

/** Bundles `createImportRule`'s collaborators so it stays within the ≤4-param budget it itself enforces. */
interface ImportRuleDeps {
  readonly kit: Kit;
  readonly resolver: Resolver;
  readonly suppressor: Suppressor;
}

/**
 * Shared `ImportDeclaration` wiring for every per-edge boundary rule
 * (`layer-order`, `cross-slice-same-layer`, `deep-import`): skip files
 * boundary does not govern, resolve the specifier to its target's
 * classification via `specifier-resolve.ts` + `fsd-path.ts`
 * [why](docs/DECISIONS.md#ad-006), and gate through the FLOW.md Step 6 sequence
 * only when `check` finds a problem. A bare or unresolvable specifier is
 * never a boundary concern.
 */
export function createImportRule(
  deps: ImportRuleDeps,
  ruleId: string,
  check: ImportCheck,
): Deno.lint.Rule {
  const { kit, resolver, suppressor } = deps;
  return {
    create(context) {
      return kit.forKnownFiles(context, (source) => ({
        ImportDeclaration(node) {
          const target = resolveImportTarget(
            node.source.value,
            context.filename,
            resolver,
          );
          if (target === null) return;
          const message = check(source, target);
          if (message === null) return;
          kit.reportAtNode({ context, suppressor, ruleId, node, message });
        },
      }));
    },
  };
}
