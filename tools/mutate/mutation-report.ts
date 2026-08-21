import type { FileMutationResult } from "../contracts/mutation";

function fileLine(result: FileMutationResult): string {
  if (result.harnessError) {
    return `${result.file}: harness-error (affected-test set may be incomplete)`;
  }
  return `${result.file}: ${result.generated} generated, ${result.killed} killed, ` +
    `${result.killedByTypes} killed-by-types, ${result.survived} survived ` +
    `(tests: ${result.testFiles.join(", ") || "none"})`;
}

/**
 * One line per file, naming the exact affected-test set that ran -- the
 * diagnosability requirement: a survivor or harness-error must be
 * identifiable from this text alone.
 */
export function formatMutationReport(
  results: readonly FileMutationResult[],
): string {
  return results.map(fileLine).join("\n");
}
