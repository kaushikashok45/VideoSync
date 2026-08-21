const OWNER_LINE = /\*\*Owner\*\*:\s*(.*)$/m;
const BACKTICK_PATH = /`([^`]+)`/g;

function ownerDirectories(sectionText: string): readonly string[] {
  const line = OWNER_LINE.exec(sectionText)?.[1] ?? "";
  return [...line.matchAll(BACKTICK_PATH)]
    .map((match) => match[1])
    .filter((path) => !path.includes("."));
}

function isDirectory(path: string): boolean {
  try {
    return Deno.statSync(path).isDirectory;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return false;
    throw error;
  }
}

function tsSources(dirPath: string): readonly string[] {
  const names = [...Deno.readDirSync(dirPath)]
    .filter((entry) =>
      entry.isFile && entry.name.endsWith(".ts") &&
      !entry.name.endsWith(".test.ts")
    )
    .map((entry) => entry.name);
  return names.map((name) => Deno.readTextFileSync(`${dirPath}/${name}`));
}

const CONSTRUCTION_SITE =
  /export\s+(class\s+\w+|(function|const)\s+(create|new)\w*)/;

function hasFactoryExport(repoRoot: string, dirPath: string): boolean {
  const fullPath = `${repoRoot}/${dirPath}`;
  if (!isDirectory(fullPath)) return false;
  return tsSources(fullPath).some((source) => CONSTRUCTION_SITE.test(source));
}

function ownerHasConstructionSite(
  repoRoot: string,
  sectionText: string,
): boolean {
  const directories = ownerDirectories(sectionText);
  if (directories.length === 0) return true;
  return directories.some((directory) => hasFactoryExport(repoRoot, directory));
}

/**
 * Heuristic only: flags `ERD-CODE DRIFT` when none of the entity's
 * `**Owner**` directories contain a non-test `.ts` file exporting a class
 * or a `create*`/`new*`-named function or const — i.e. no plausible
 * construction site exists that could enforce a declared invariant. This
 * cannot prove an invariant is enforced, only that a construction site is
 * absent; a negative result is reported as drift, never a hard failure.
 * Proving enforcement belongs to `reviewer-contracts-tests`
 * (docs/GOVERNANCE.md).
 */
export function driftFlags(
  entity: string,
  sectionText: string,
  repoRoot: string,
): readonly string[] {
  if (ownerHasConstructionSite(repoRoot, sectionText)) return [];
  return [
    `${entity}: ERD-CODE DRIFT — no construction site or factory found for a declared invariant`,
  ];
}
