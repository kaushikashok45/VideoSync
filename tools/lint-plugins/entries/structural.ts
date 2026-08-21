import { createStructuralPlugin } from "../structural-plugin.ts";

const REPO_ROOT = new URL("../../../", import.meta.url).pathname.replace(
  /\/$/,
  "",
);

/**
 * `deno.json` -> `lint.plugins` loads a plugin module by specifier and
 * requires a default export of the `Deno.lint.Plugin` object itself --
 * Deno's own loader contract, not a project convention -- so this thin
 * shim is the one place that default export is unavoidable. Exempted in
 * `no-default-export-rule.ts` by the same closed, path-exact mechanism
 * already used for React Router's framework entries.
 */
export default createStructuralPlugin(REPO_ROOT);
