import { governedDiff } from "./governed-diff.ts";
import { hasClearReceipt } from "./receipt-lookup.ts";
import { gitWriteTree } from "./git-tree-hash.ts";
import type { PreCommitDeps, StepOutcome } from "../contracts/precommit";

const BLOCK_NO_RECEIPT =
  "Run: deno task precommit, then /review-now, then retry.";

function runPrecommitTask(repoRoot: string): StepOutcome {
  const result = new Deno.Command("deno", {
    args: ["task", "precommit"],
    cwd: repoRoot,
    stdout: "piped",
    stderr: "piped",
  }).outputSync();
  const decoder = new TextDecoder();
  return {
    ok: result.success,
    output: decoder.decode(result.stdout) + decoder.decode(result.stderr),
  };
}

function writeMarker(repoRoot: string, gitDir: string): void {
  Deno.writeTextFileSync(
    `${gitDir}/.governance-last-run`,
    gitWriteTree(repoRoot),
  );
}

const REAL_DEPS: PreCommitDeps = {
  receiptKey: () => governedDiff().receiptKey,
  hasReceipt: hasClearReceipt,
  runPrecommitTask,
  writeMarker,
};

/**
 * `.git/hooks/pre-commit`'s Deno entrypoint (`docs/DECISIONS.md#ad-015`).
 * Step 1: a clear receipt for the exact staged diff must already exist --
 * checked before anything expensive runs, so a no-receipt commit blocks in
 * milliseconds. Step 2: re-run `deno task precommit` as defense in depth
 * (the receipt's existence already implies it passed once; this catches the
 * tree diverging after `/review-now` ran but before commit). Step 3: record
 * the verified tree hash for `commit-msg-hook.ts`. `deps` defaults to the
 * real git/subprocess implementations; tests substitute fakes for the
 * expensive step while keeping receipt-lookup and diff-hashing real.
 */
export function runPreCommitHook(
  repoRoot: string,
  gitDir: string,
  deps: PreCommitDeps = REAL_DEPS,
): number {
  const receiptKey = deps.receiptKey();
  if (!deps.hasReceipt(repoRoot, receiptKey)) {
    console.error(BLOCK_NO_RECEIPT);
    return 1;
  }
  const result = deps.runPrecommitTask(repoRoot);
  if (!result.ok) {
    console.error(
      "pre-commit: the tree diverged from what the receipt certified.",
    );
    console.error(result.output);
    return 1;
  }
  deps.writeMarker(repoRoot, gitDir);
  return 0;
}

if (import.meta.main) {
  const repoRoot = Deno.cwd();
  Deno.exit(runPreCommitHook(repoRoot, `${repoRoot}/.git`));
}
