/**
 * `git write-tree`'s output: a content-addressed hash of the current index,
 * independent of any commit/parent. Used to detect whether the staged tree
 * changed between `pre-commit` succeeding and `commit-msg` running.
 */
export function gitWriteTree(repoRoot: string): string {
  const result = new Deno.Command("git", {
    args: ["write-tree"],
    cwd: repoRoot,
  }).outputSync();
  if (!result.success) {
    const stderr = new TextDecoder().decode(result.stderr);
    throw new Error(`git write-tree failed: ${stderr}`);
  }
  return new TextDecoder().decode(result.stdout).trim();
}
