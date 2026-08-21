function runGit(args: readonly string[]): Deno.CommandOutput {
  return new Deno.Command("git", {
    args: [...args],
    stdout: "null",
    stderr: "piped",
  })
    .outputSync();
}

function removeWorktree(repoRoot: string, worktreeDir: string): void {
  const result = runGit([
    "-C",
    repoRoot,
    "worktree",
    "remove",
    "--force",
    worktreeDir,
  ]);
  if (result.success) return;
  const stderr = new TextDecoder().decode(result.stderr);
  Deno.stderr.writeSync(
    new TextEncoder().encode(
      `worktree: failed to remove ${worktreeDir}, remove it manually: ${stderr}\n`,
    ),
  );
}

/**
 * Opens exactly one detached `git worktree` at `HEAD` for the duration of
 * `run`, and removes it in a `finally` -- including when `run` throws -- so
 * a crashed mutation run leaves no worktree behind. This is the only module
 * in `tools/mutate` with a filesystem side effect outside the test sandbox.
 */
export function withMutationWorktree<T>(
  repoRoot: string,
  run: (worktreeDir: string) => T,
): T {
  const worktreeDir = Deno.makeTempDirSync({ prefix: "videosync-mutate-" });
  Deno.removeSync(worktreeDir);
  const added = new Deno.Command("git", {
    args: ["-C", repoRoot, "worktree", "add", worktreeDir, "HEAD", "--detach"],
    stdout: "null",
    stderr: "piped",
  }).outputSync();
  if (!added.success) {
    const stderr = new TextDecoder().decode(added.stderr);
    throw new Error(`worktree: failed to create ${worktreeDir}: ${stderr}`);
  }
  try {
    return run(worktreeDir);
  } finally {
    removeWorktree(repoRoot, worktreeDir);
  }
}
