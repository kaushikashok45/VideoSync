import type { createSemanticsRuleKit } from "./semantics-rule-kit.ts";
import type { Suppressor } from "../../contracts/suppress";

type Kit = ReturnType<typeof createSemanticsRuleKit>;

const RULE_ID = "semantics/no-default-export";
const MESSAGE = "export default is banned: named exports keep every symbol " +
  "greppable. Only React Router's own framework entries, the route modules " +
  "it discovers by path, and deno.json's lint.plugins loader shims are " +
  "exempt. Use a named export.";

const EXACT_EXEMPT = new Set([
  "app/routes.ts",
  "app/root.tsx",
  "app/entry.server.tsx",
  "app/entry.client.tsx",
]);
const ROUTE_TOP_LEVEL_FILE = /^app\/routes\/[^/]+\.tsx$/;
const ROUTE_MODULE_FILE = /^app\/routes\/[^/]+\/route\.tsx$/;
/**
 * `deno.json` -> `lint.plugins` loads a plugin module by specifier and
 * requires a default export of the `Deno.lint.Plugin` object itself --
 * Deno's own loader contract, not a style choice. Closed to exactly these
 * four shims, mirroring the route-file carve-out's path-exact shape.
 */
const PLUGIN_ENTRY_FILE = /^tools\/lint-plugins\/entries\/[^/]+\.ts$/;

function repoRelative(absolutePath: string, repoRoot: string): string {
  return absolutePath.startsWith(repoRoot)
    ? absolutePath.slice(repoRoot.length).replace(/^\/+/, "")
    : absolutePath;
}

/**
 * The carve-out is path-exact and closed (`docs/GOVERNANCE.md`, Tier 2,
 * `no-default-export`). Colocated `components/**`
 * and `logic/**` files beneath `app/routes/` are deliberately NOT exempt --
 * only a top-level `<name>.tsx` or a `<name>/route.tsx` is a real route
 * module React Router will discover by path.
 */
function isExemptRoutePath(relativePath: string): boolean {
  if (EXACT_EXEMPT.has(relativePath)) return true;
  if (PLUGIN_ENTRY_FILE.test(relativePath)) return true;
  return ROUTE_TOP_LEVEL_FILE.test(relativePath) ||
    ROUTE_MODULE_FILE.test(relativePath);
}

export function createNoDefaultExportRule(
  kit: Kit,
  suppressor: Suppressor,
  repoRoot: string,
): Deno.lint.Rule {
  return {
    create(context) {
      return kit.forKnownFiles(context, () => {
        const relative = repoRelative(context.filename, repoRoot);
        if (isExemptRoutePath(relative)) return {};
        return {
          ExportDefaultDeclaration(node) {
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
