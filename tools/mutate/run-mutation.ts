import type { FileMutationResult, MutationRun } from "../contracts/mutation";
import { readEdgesJsonl } from "../graph/read-edges.ts";
import { affectedTests } from "./affected-tests.ts";
import { nonLiteralDynamicImportSites } from "./dynamic-import-sites.ts";
import { mutateFile } from "./mutate-file.ts";
import { sourceFilesToMutate } from "./resolve-files.ts";
import { withMutationWorktree } from "./worktree.ts";

const MUTATION_ROOTS = ["app", "server", "shared"];

function harnessErrorResult(file: string): FileMutationResult {
  return {
    file,
    generated: 0,
    killed: 0,
    killedByTypes: 0,
    survived: 0,
    harnessError: true,
    testFiles: [],
  };
}

function resultFor(
  worktreeDir: string,
  file: string,
  edges: ReturnType<typeof readEdgesJsonl>,
  dynamicSiteCount: number,
): FileMutationResult {
  const testFiles = affectedTests(file, edges);
  if (testFiles.length === 0 && dynamicSiteCount > 0) {
    return harnessErrorResult(file);
  }
  return mutateFile(worktreeDir, file, testFiles);
}

/**
 * Resolves the files this run should mutate, opens one worktree, mutates
 * each -- gating on the dynamic-import-site count per file, per the
 * affected-test-completeness rule -- and tallies the run's exit code: `2` if
 * any file was a harness error, else `1` if any mutant survived, else `0`.
 */
export function runMutation(
  args: readonly string[],
  repoRoot: string,
): MutationRun {
  const files = sourceFilesToMutate(args, repoRoot);
  if (files.length === 0) return { exitCode: 0, results: [] };
  const edges = readEdgesJsonl(`${repoRoot}/tools/graph/edges.jsonl`);
  const dynamicSiteCount =
    nonLiteralDynamicImportSites(repoRoot, MUTATION_ROOTS).length;
  const results = withMutationWorktree(
    repoRoot,
    (worktreeDir) =>
      files.map((file) =>
        resultFor(worktreeDir, file, edges, dynamicSiteCount)
      ),
  );
  const exitCode = results.some((result) => result.harnessError)
    ? 2
    : results.some((result) => result.survived > 0)
    ? 1
    : 0;
  return { exitCode, results };
}
