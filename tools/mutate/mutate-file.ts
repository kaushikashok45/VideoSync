import type { FileMutationResult, MutantVerdict } from "../contracts/mutation";
import { classifyMutant } from "./classify-mutant.ts";
import { generateMutants } from "./mutants.ts";

function restore(worktreeDir: string, relativeFile: string): void {
  new Deno.Command("git", {
    args: ["checkout", "HEAD", "--", relativeFile],
    cwd: worktreeDir,
    stdout: "null",
    stderr: "null",
  }).outputSync();
}

function tally(
  result: { killed: number; killedByTypes: number; survived: number },
  verdict: MutantVerdict,
): void {
  if (verdict === "killed") result.killed++;
  else if (verdict === "killed-by-types") result.killedByTypes++;
  else result.survived++;
}

function runOneMutant(
  worktreeDir: string,
  relativeFile: string,
  testFiles: readonly string[],
  mutantSource: string,
): MutantVerdict {
  Deno.writeTextFileSync(`${worktreeDir}/${relativeFile}`, mutantSource);
  try {
    return classifyMutant(worktreeDir, relativeFile, testFiles);
  } finally {
    restore(worktreeDir, relativeFile);
  }
}

/**
 * Mutates one file inside `worktreeDir`, one mutant at a time -- classifying
 * and restoring (`git checkout HEAD --`) between each -- and tallies the
 * result. Assumes the caller has already decided `testFiles` is trustworthy
 * (see `run-mutation.harness.ts`'s dynamic-import-site gate).
 */
export function mutateFile(
  worktreeDir: string,
  file: string,
  testFiles: readonly string[],
): FileMutationResult {
  const original = Deno.readTextFileSync(`${worktreeDir}/${file}`);
  const mutants = generateMutants(original, file);
  const counts = { killed: 0, killedByTypes: 0, survived: 0 };
  for (const mutant of mutants) {
    tally(counts, runOneMutant(worktreeDir, file, testFiles, mutant.source));
  }
  return {
    file,
    generated: mutants.length,
    killed: counts.killed,
    killedByTypes: counts.killedByTypes,
    survived: counts.survived,
    harnessError: false,
    testFiles,
  };
}
