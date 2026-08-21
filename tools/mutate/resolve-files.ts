import { governedDiff } from "../cli/governed-diff.ts";
import { sourceFilesUnder } from "./source-files.ts";

const MUTATION_ROOTS = ["app", "server", "shared"];

function isMutableSource(path: string): boolean {
  return /\.(?:ts|tsx)$/.test(path) && !/\.test\.tsx?$/.test(path);
}

function allSourceFiles(repoRoot: string): readonly string[] {
  const files: string[] = [];
  for (const root of MUTATION_ROOTS) {
    for (const absolute of sourceFilesUnder(`${repoRoot}/${root}`)) {
      files.push(absolute.slice(repoRoot.length + 1));
    }
  }
  return files;
}

/**
 * The files `mutate` should mutate this run: `--all` walks every source file
 * under `app/server/shared`; otherwise (matching `docs/GOVERNANCE.md`'s D1)
 * it is `governedDiff().changedFiles`, and with neither flag it is empty --
 * `mutate` with no flag mutates nothing, mirroring `deno task precommit`'s
 * own `mutate --changed`.
 */
export function sourceFilesToMutate(
  args: readonly string[],
  repoRoot: string,
): readonly string[] {
  if (args.includes("--all")) {
    return allSourceFiles(repoRoot).filter(isMutableSource);
  }
  if (!args.includes("--changed")) return [];
  return governedDiff().changedFiles.filter(isMutableSource);
}
