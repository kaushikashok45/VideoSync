import { governedDiff } from "../../cli/governed-diff.ts";
import { ignoreExpectedFailure } from "./ignore-expected-failure.ts";

/**
 * `governedDiff()` shells `git` relative to the process's current working
 * directory, not a parameter, so this wraps it with a `chdir` into
 * `repoRoot` [why](docs/DECISIONS.md#ad-007) and degrades to an empty set --
 * rather than throwing out of plugin construction -- when `repoRoot` is not
 * a git repository. `contract-first` is the only rule that reads this, and
 * "no diff available" honestly answers "no slice is new" without aborting
 * every other boundary rule over a concern that is not theirs.
 */
export function addedFilesFor(repoRoot: string): ReadonlySet<string> {
  const original = Deno.cwd();
  try {
    Deno.chdir(repoRoot);
    return new Set(governedDiff().addedFiles);
  } catch (error) {
    ignoreExpectedFailure(error);
    return new Set();
  } finally {
    Deno.chdir(original);
  }
}
