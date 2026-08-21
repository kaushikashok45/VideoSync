import { gitWriteTree } from "./git-tree-hash.ts";
import { ignoreExpectedFailure } from "../lint-plugins/shared/ignore-expected-failure.ts";

const TRAILER = "\nGovernance-Bypass: true (pre-commit skipped)\n";

function readMarker(markerPath: string): string | null {
  try {
    return Deno.readTextFileSync(markerPath).trim();
  } catch (error) {
    ignoreExpectedFailure(error);
    return null;
  }
}

function removeMarker(markerPath: string): void {
  try {
    Deno.removeSync(markerPath);
  } catch (error) {
    ignoreExpectedFailure(error);
  }
}

function appendTrailer(msgFilePath: string): void {
  const existing = Deno.readTextFileSync(msgFilePath);
  Deno.writeTextFileSync(msgFilePath, existing + TRAILER);
}

/**
 * `.git/hooks/commit-msg`'s Deno entrypoint. Compares the currently staged
 * tree hash against the one `pre-commit-hook.ts` recorded on its last
 * success; a mismatch -- including "no marker at all", i.e. `pre-commit`
 * never ran this cycle -- means the commit bypassed the gate, so the
 * trailer is appended to make that fact permanent and visible in `git log`.
 * The marker is deleted either way: single-use, so an unchanged tree
 * committed a second time without `pre-commit` having just run cannot
 * silently reuse a stale match from a previous, legitimate commit
 * (`DECISION.md#d-002`). Never blocks the commit -- only annotates it.
 */
export function runCommitMsgHook(
  repoRoot: string,
  gitDir: string,
  msgFilePath: string,
): number {
  const markerPath = `${gitDir}/.governance-last-run`;
  const lastRun = readMarker(markerPath);
  removeMarker(markerPath);
  if (lastRun !== gitWriteTree(repoRoot)) {
    appendTrailer(msgFilePath);
  }
  return 0;
}

if (import.meta.main) {
  const repoRoot = Deno.cwd();
  Deno.exit(
    runCommitMsgHook(repoRoot, `${repoRoot}/.git`, Deno.args[0]),
  );
}
