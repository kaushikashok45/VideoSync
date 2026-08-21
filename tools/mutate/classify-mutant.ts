import type { MutantVerdict } from "../contracts/mutation";

function typechecks(worktreeDir: string, relativeFile: string): boolean {
  return new Deno.Command("deno", {
    args: ["check", "--sloppy-imports", relativeFile],
    cwd: worktreeDir,
    stdout: "null",
    stderr: "null",
  }).outputSync().success;
}

function testsPass(
  worktreeDir: string,
  testFiles: readonly string[],
): boolean {
  return new Deno.Command("deno", {
    args: ["test", "-A", "--no-check", "--sloppy-imports", ...testFiles],
    cwd: worktreeDir,
    stdout: "null",
    stderr: "null",
  }).outputSync().success;
}

/**
 * Classifies one mutant already written into the worktree's copy of
 * `relativeFile`. Type-checks the mutated file alone first: a type failure
 * is reported `"killed-by-types"` without ever running a test, so a reader
 * can see how much of the kill rate is the type system versus the test
 * suite. Only a file that still type-checks runs its affected tests, with
 * `--no-check` since the file is already verified -- running everything
 * `--no-check` and folding type failures into "killed" would hide that
 * distinction and produce false survivors.
 */
export function classifyMutant(
  worktreeDir: string,
  relativeFile: string,
  testFiles: readonly string[],
): MutantVerdict {
  if (!typechecks(worktreeDir, relativeFile)) return "killed-by-types";
  if (testFiles.length === 0) return "survived";
  return testsPass(worktreeDir, testFiles) ? "survived" : "killed";
}
