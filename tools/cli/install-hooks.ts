function preCommitScript(repoRoot: string): string {
  return `#!/bin/sh\nexec deno run -A "${repoRoot}/tools/cli/pre-commit-hook.ts"\n`;
}

function commitMsgScript(repoRoot: string): string {
  return `#!/bin/sh\nexec deno run -A "${repoRoot}/tools/cli/commit-msg-hook.ts" "$1"\n`;
}

function writeExecutable(path: string, contents: string): void {
  Deno.writeTextFileSync(path, contents);
  Deno.chmodSync(path, 0o755);
}

/**
 * `deno task setup-hooks`'s entrypoint: writes thin POSIX-sh wrappers to
 * `<gitDir>/hooks/pre-commit` and `<gitDir>/hooks/commit-msg`, each `exec`ing
 * a Deno entrypoint -- all real logic lives in the testable `.ts` modules,
 * never embedded in shell (Phase 5 brief, Part 2). Idempotent: re-running
 * overwrites both files cleanly. `gitDir` and `repoRoot` are separate
 * parameters (rather than deriving one from the other) so tests can point
 * this at a disposable fixture repo instead of this repo's real `.git`.
 */
export function installHooks(gitDir: string, repoRoot: string): void {
  writeExecutable(`${gitDir}/hooks/pre-commit`, preCommitScript(repoRoot));
  writeExecutable(`${gitDir}/hooks/commit-msg`, commitMsgScript(repoRoot));
}

if (import.meta.main) {
  const repoRoot = new URL("../../", import.meta.url).pathname.replace(
    /\/$/,
    "",
  );
  installHooks(`${repoRoot}/.git`, repoRoot);
  console.log("installed .git/hooks/pre-commit and .git/hooks/commit-msg");
}
