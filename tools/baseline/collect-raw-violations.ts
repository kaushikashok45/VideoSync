import { createStructuralPlugin } from "../lint-plugins/structural-plugin.ts";
import { createBoundaryPlugin } from "../lint-plugins/boundary-plugin.ts";
import { createDumbUiPlugin } from "../lint-plugins/dumb-ui-plugin.ts";
import { createSemanticsPlugin } from "../lint-plugins/semantics-plugin.ts";
import { activeViolationRecorder } from "../lint-plugins/shared/violation-recorder.ts";
import type { LoadedFile, RawViolation } from "../contracts/baseline-generate";

function pluginsFor(repoRoot: string): readonly Deno.lint.Plugin[] {
  return [
    createStructuralPlugin(repoRoot),
    createBoundaryPlugin(repoRoot),
    createDumbUiPlugin(repoRoot),
    createSemanticsPlugin(repoRoot),
  ];
}

function scanFile(
  plugins: readonly Deno.lint.Plugin[],
  file: LoadedFile,
): void {
  for (const plugin of plugins) {
    Deno.lint.runPlugin(plugin, file.absolutePath, file.source);
  }
}

/**
 * Scans every file with all four plugins under a single active recorder,
 * capturing every violation candidate -- suppressed or not -- so the result
 * reflects the tree's true current state regardless of what `baseline.json`
 * on disk currently says [why](docs/DECISIONS.md#ad-005). This is the only
 * caller allowed to touch `activeViolationRecorder`.
 */
export function collectRawViolations(
  repoRoot: string,
  files: readonly LoadedFile[],
): readonly RawViolation[] {
  const collected: RawViolation[] = [];
  activeViolationRecorder.current = (path, identity, ruleId) => {
    collected.push({ path, identity, ruleId });
  };
  try {
    const plugins = pluginsFor(repoRoot);
    for (const file of files) scanFile(plugins, file);
  } finally {
    activeViolationRecorder.current = null;
  }
  return collected;
}
