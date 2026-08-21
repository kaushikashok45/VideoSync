import { ignoreExpectedFailure } from "../lint-plugins/shared/ignore-expected-failure.ts";
import type { LintJsonResult } from "../contracts/deno-lint-json";

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function parseOutput(stdout: string): LintJsonResult {
  try {
    const parsed = JSON.parse(stdout);
    return { ok: true, diagnostics: parsed.diagnostics ?? [] };
  } catch (error) {
    ignoreExpectedFailure(error);
    return {
      ok: false,
      error: `could not parse deno lint --json output: ${describe(error)}`,
    };
  }
}

/**
 * Shells out to `deno lint --json`, run from `repoRoot` so it resolves the
 * project's own `deno.json` -> `lint.plugins` registration. Replaces
 * `Deno.lint.runPlugin`, which only works under the `deno test` subcommand
 * and cannot drive a `deno run` CLI [why](docs/DECISIONS.md#ad-007).
 */
export async function runDenoLintJson(
  repoRoot: string,
  files: readonly string[],
): Promise<LintJsonResult> {
  const command = new Deno.Command("deno", {
    args: ["lint", "--json", ...files],
    cwd: repoRoot,
    stdout: "piped",
    stderr: "piped",
  });
  const { stdout } = await command.output();
  return parseOutput(new TextDecoder().decode(stdout));
}
