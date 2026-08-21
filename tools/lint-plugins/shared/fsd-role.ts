import type { SliceRole } from "../../contracts/fsd-path";

const ROLE_FOLDERS: readonly SliceRole[] = [
  "ui",
  "model",
  "api",
  "lib",
  "contracts",
];

function roleFolder(name: string): SliceRole | undefined {
  return ROLE_FOLDERS.find((folder) => folder === name);
}

function indexRole(relative: readonly string[]): SliceRole {
  return relative.length === 3 && /^index\.tsx?$/.test(relative[2])
    ? "index"
    : "other";
}

function roleFromSliceChild(relative: readonly string[]): SliceRole {
  const folder = relative.length > 3 ? roleFolder(relative[2]) : undefined;
  return folder ?? indexRole(relative);
}

/**
 * The slice-internal role a file plays, per AGENTS.md's module layout.
 * `fsd-path.ts`'s `classify` is the sole caller -- this never re-derives
 * slice membership itself, only the role once a slice is already known.
 */
export function roleOf(
  relative: readonly string[],
  isTest: boolean,
  hasSlice: boolean,
): SliceRole {
  if (isTest) return "test";
  if (!hasSlice) return "other";
  return roleFromSliceChild(relative);
}
