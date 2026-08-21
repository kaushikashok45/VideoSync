import { scopedSourceFiles } from "./scoped-source-files.ts";
import { runDenoLintJson } from "./deno-lint-json.ts";
import type { LintDiagnostic } from "../contracts/deno-lint-json";

const REPO_ROOT = new URL("../../", import.meta.url).pathname.replace(
  /\/$/,
  "",
);

function parseScope(
  args: readonly string[],
  commandName: string,
): "changed" | "all" {
  if (args.includes("--all")) return "all";
  if (args.includes("--changed")) return "changed";
  throw new Error(`usage: ${commandName}.ts (--changed|--all)`);
}

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function resolveFiles(
  args: readonly string[],
  commandName: string,
): Promise<readonly string[] | number> {
  try {
    return await scopedSourceFiles(parseScope(args, commandName));
  } catch (error) {
    console.error(`${commandName}: ${describe(error)}`);
    return 2;
  }
}

/** One `check-*.ts` CLI's identity: which rule-id prefix it reports on. */
interface PluginCheckConfig {
  readonly commandName: string;
  readonly rulePrefix: string;
}

function relativePathOf(diagnostic: LintDiagnostic): string {
  const absolute = diagnostic.filename.replace(/^file:\/\//, "");
  return absolute.startsWith(`${REPO_ROOT}/`)
    ? absolute.slice(REPO_ROOT.length + 1)
    : absolute;
}

function findingLine(diagnostic: LintDiagnostic): string {
  const line = diagnostic.range.start.line;
  return `${
    relativePathOf(diagnostic)
  }:${line} ${diagnostic.code} ${diagnostic.message}`;
}

function isOwnFinding(diagnostic: LintDiagnostic, rulePrefix: string): boolean {
  return diagnostic.code.startsWith(`${rulePrefix}/`);
}

async function collectFindings(
  files: readonly string[],
  config: PluginCheckConfig,
): Promise<readonly string[] | number> {
  const result = await runDenoLintJson(REPO_ROOT, files);
  if (!result.ok) {
    console.error(`${config.commandName}: ${result.error}`);
    return 2;
  }
  return result.diagnostics
    .filter((diagnostic) => isOwnFinding(diagnostic, config.rulePrefix))
    .map(findingLine);
}

function reportAndExitCode(findings: readonly string[]): number {
  for (const finding of findings) console.log(finding);
  return findings.length > 0 ? 1 : 0;
}

async function runWithFiles(
  files: readonly string[],
  config: PluginCheckConfig,
): Promise<number> {
  if (files.length === 0) return 0;
  const findings = await collectFindings(files, config);
  return typeof findings === "number" ? findings : reportAndExitCode(findings);
}

/**
 * The four `check-*.ts` CLIs are otherwise identical, differing only in
 * which rule-id prefix they filter `deno lint --json` for -- the plugin
 * itself is driven by `deno.json` -> `lint.plugins`, never constructed here
 * [why](docs/DECISIONS.md#ad-007).
 */
export function createPluginCheckRunner(
  config: PluginCheckConfig,
): (args: readonly string[]) => Promise<number> {
  return async function run(args: readonly string[]): Promise<number> {
    const files = await resolveFiles(args, config.commandName);
    return typeof files === "number" ? files : runWithFiles(files, config);
  };
}
