import { loadSuppressor } from "./shared/suppress.ts";
import { createResolver } from "./shared/specifier-resolve.ts";
import { createDumbUiRuleKit } from "./shared/dumb-ui-rule-kit.ts";
import { createNoSmartImportRule } from "./shared/no-smart-import-rule.ts";
import { createNoLocalStateRule } from "./shared/no-local-state-rule.ts";

/**
 * ARCH-002: presentation is props-only. Activates only on files
 * `classify().isPresentation` reports true for -- a `.tsx` under a slice's
 * `ui/` or legacy `components/`, legacy included [why](docs/DECISIONS.md#ad-004).
 * Not registered in `deno.json` until commit 7 [why](docs/DECISIONS.md#ad-010);
 * exercised only via `Deno.lint.runPlugin` until then.
 */
export function createDumbUiPlugin(repoRoot: string): Deno.lint.Plugin {
  const suppressor = loadSuppressor(
    `${repoRoot}/tools/baseline/baseline.json`,
  );
  const resolver = createResolver(`${repoRoot}/deno.json`);
  const kit = createDumbUiRuleKit(repoRoot);
  return {
    name: "dumb-ui",
    rules: {
      "no-smart-import": createNoSmartImportRule(
        kit,
        resolver,
        suppressor,
        repoRoot,
      ),
      "no-local-state": createNoLocalStateRule(kit, suppressor),
    },
  };
}
