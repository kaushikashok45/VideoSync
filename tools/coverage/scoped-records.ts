import { classify } from "../lint-plugins/shared/fsd-path.ts";
import { parseLcov } from "./lcov-parse.ts";
import { isFloorScoped } from "./scope.ts";

/** `deno coverage --lcov` emits `SF:` as an absolute path -- verified empirically. */
function relativize(repoRoot: string, absolutePath: string): string {
  return absolutePath.startsWith(`${repoRoot}/`)
    ? absolutePath.slice(repoRoot.length + 1)
    : absolutePath;
}

function isInScope(
  repoRoot: string,
  relativeFile: string,
  all: boolean,
  changed: readonly string[],
): boolean {
  if (!all && !changed.includes(relativeFile)) return false;
  const fsd = classify(`${repoRoot}/${relativeFile}`);
  return isFloorScoped(fsd) && !fsd.isPresentation;
}

/**
 * Parses raw lcov text, relativizes each `SF:` against `repoRoot` (`deno
 * coverage --lcov` emits it as an absolute on-disk path, verified against a
 * throwaway fixture -- comparing it to a repo-relative changed-file list
 * without this step silently matches nothing), and keeps only records in
 * the floor's scope: `--all` or one of `changed`; and
 * `model`/`api`/`lib`/`entities`; and not presentation.
 */
export function scopedRecords(
  repoRoot: string,
  lcovText: string,
  all: boolean,
  changed: readonly string[],
): ReturnType<typeof parseLcov> {
  return parseLcov(lcovText)
    .map((record) => ({ ...record, file: relativize(repoRoot, record.file) }))
    .filter((record) => isInScope(repoRoot, record.file, all, changed));
}
