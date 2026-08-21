function readDirNames(path: string): readonly string[] {
  try {
    return [...Deno.readDirSync(path)]
      .filter((entry) => entry.isDirectory)
      .map((entry) => entry.name);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return [];
    throw error;
  }
}

/**
 * Every directory under `app/entities` and `server/entities`, as
 * `<root>/<name>` paths relative to `repoRoot`. Used by `erd-check.ts` to
 * fail on an entity directory absent from `ERD.md`.
 */
export function entityDirectories(repoRoot: string): readonly string[] {
  return ["app/entities", "server/entities"].flatMap((root) =>
    readDirNames(`${repoRoot}/${root}`).map((name) => `${root}/${name}`)
  );
}
