import { createHash } from "node:crypto";
import type { GovernedDiff } from "../contracts/governed-diff";

const RECEIPT_EXCLUSIONS = [
  ":(exclude).claude/review-receipts/**",
  ":(exclude).agents/review-receipts/**",
  ":(exclude).opencode/review-receipts/**",
];
const D1_FLAGS = ["--no-color", "--no-ext-diff", "-U3"];
const D1_PATHSPEC = ["--", ".", ...RECEIPT_EXCLUSIONS];

function runGitDiff(extraArgs: readonly string[]): string {
  const args = [
    "-c",
    "core.abbrev=40",
    "diff",
    "--cached",
    ...D1_FLAGS,
    ...extraArgs,
    ...D1_PATHSPEC,
  ];
  const result = new Deno.Command("git", { args }).outputSync();
  if (!result.success) {
    const stderr = new TextDecoder().decode(result.stderr);
    throw new Error(
      `governed diff failed: git is unavailable or this is not a git repository (${stderr})`,
    );
  }
  return new TextDecoder().decode(result.stdout);
}

function namesFrom(output: string): readonly string[] {
  return output.split("\n").filter((line) => line.length > 0);
}

/**
 * Runs the D1 governed diff (`docs/GOVERNANCE.md`) exactly once, verbatim:
 * staged, `--no-color --no-ext-diff -U3`, with the review-receipts
 * exclusion. Every consumer that hashes, reviews, or scopes to "the change"
 * imports this rather than computing its own diff.
 */
export function governedDiff(): GovernedDiff {
  const patch = runGitDiff([]);
  const changedFiles = namesFrom(runGitDiff(["--name-only"]));
  const addedFiles = namesFrom(runGitDiff(["--diff-filter=A", "--name-only"]));
  const receiptKey = createHash("sha256").update(patch).digest("hex");
  return { patch, receiptKey, changedFiles, addedFiles };
}
