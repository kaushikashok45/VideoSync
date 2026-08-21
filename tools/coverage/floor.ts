import { governedDiff } from "../cli/governed-diff.ts";
import { coverageReport } from "./coverage-report.ts";
import { scopedRecords } from "./scoped-records.ts";

const DEFAULT_FLOOR = 80;
const REPO_ROOT = new URL("../../", import.meta.url).pathname.replace(
  /\/$/,
  "",
);

function writeLine(message: string): void {
  Deno.stdout.writeSync(new TextEncoder().encode(`${message}\n`));
}

function runCoverage(): string | null {
  const coverageDir = ".coverage-floor";
  const tests = new Deno.Command("deno", {
    args: ["test", "-A", "--sloppy-imports", `--coverage=${coverageDir}`],
    stdout: "null",
  }).outputSync();
  if (!tests.success) return null;
  const lcov = new Deno.Command("deno", {
    args: ["coverage", coverageDir, "--lcov"],
    stdout: "piped",
  }).outputSync();
  return lcov.success ? new TextDecoder().decode(lcov.stdout) : null;
}

function floorArgOf(args: readonly string[]): number {
  const raw = args.find((arg) => arg.startsWith("--floor="))
    ?.slice("--floor=".length);
  return raw === undefined ? DEFAULT_FLOOR : Number(raw);
}

function run(args: readonly string[]): number {
  const all = args.includes("--all");
  const changed = all ? [] : governedDiff().changedFiles;
  const lcovText = runCoverage();
  if (lcovText === null) return 1;
  const records = scopedRecords(REPO_ROOT, lcovText, all, changed);
  const { lines, failed } = coverageReport(records, floorArgOf(args));
  lines.forEach(writeLine);
  return failed ? 1 : 0;
}

if (import.meta.main) Deno.exit(run(Deno.args));

export { run as runCoverageFloor };
