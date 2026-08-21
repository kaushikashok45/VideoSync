import type { createBoundaryRuleKit } from "./boundary-rule-kit.ts";
import type { Suppressor } from "../../contracts/suppress";

type Kit = ReturnType<typeof createBoundaryRuleKit>;

const RULE_ID = "boundary/no-star-export";
const MESSAGE =
  "A slice's index.ts may not use `export * from`; use named re-exports " +
  "so the public surface stays countable.";

/**
 * `countProgramExports` counts `export * from './x'` as exactly one binding
 * (the AST cannot see how many names the re-exported module actually has),
 * so an `index.ts` re-exporting `*` from every internal file measures as 1
 * and slips under `public-surface-cap`'s limit of 7 -- precisely the barrel
 * form the cap exists to stop. Only a slice's own public entry is in scope;
 * `export *` anywhere else is not this rule's concern.
 */
export function createNoStarExportRule(
  kit: Kit,
  suppressor: Suppressor,
): Deno.lint.Rule {
  return {
    create(context) {
      return kit.forKnownFiles(context, (fsd) => ({
        ExportAllDeclaration(node) {
          if (fsd.role !== "index") return;
          kit.reportAtNode({
            context,
            suppressor,
            ruleId: RULE_ID,
            node,
            message: MESSAGE,
          });
        },
      }));
    },
  };
}
