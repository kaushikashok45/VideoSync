import type { FeatureFiles } from "../contracts/docs-check";

/**
 * Every `.md` file directly under `docs/features/<slug>/`, keyed by its
 * repo-relative path.
 */
export function readFeatureFiles(repoRoot: string, slug: string): FeatureFiles {
  const root = `${repoRoot}/docs/features/${slug}`;
  const files = new Map<string, string>();
  for (const entry of Deno.readDirSync(root)) {
    if (!entry.isFile || !entry.name.endsWith(".md")) continue;
    const path = `docs/features/${slug}/${entry.name}`;
    files.set(path, Deno.readTextFileSync(`${repoRoot}/${path}`));
  }
  return files;
}
