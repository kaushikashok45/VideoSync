import { createResolver } from "../lint-plugins/shared/specifier-resolve.ts";
import { ignoreExpectedFailure } from "../lint-plugins/shared/ignore-expected-failure.ts";
import { buildEdges } from "./build-edges.ts";
import { writeEdgesJsonl } from "./write-edges.ts";

const REPO_ROOT = new URL("../../", import.meta.url).pathname.replace(
  /\/$/,
  "",
);
const OUTPUT_PATH = `${REPO_ROOT}/tools/graph/edges.jsonl`;
const WALK_ROOTS = ["app", "server", "shared"];
const SOURCE_EXTENSION = /\.tsx?$/;

function shouldSkip(name: string): boolean {
  return name === "node_modules" || name.startsWith(".");
}

async function* walkEntry(
  dir: string,
  entry: Deno.DirEntry,
): AsyncGenerator<string> {
  const full = `${dir}/${entry.name}`;
  if (entry.isDirectory) {
    yield* walk(full);
    return;
  }
  if (entry.isFile) yield full;
}

async function* walk(dir: string): AsyncGenerator<string> {
  for await (const entry of Deno.readDir(dir)) {
    if (shouldSkip(entry.name)) continue;
    yield* walkEntry(dir, entry);
  }
}

async function sourceFilesUnder(root: string): Promise<readonly string[]> {
  const base = `${REPO_ROOT}/${root}`;
  const files: string[] = [];
  try {
    for await (const path of walk(base)) {
      if (SOURCE_EXTENSION.test(path)) files.push(path);
    }
  } catch (error) {
    ignoreExpectedFailure(error);
    return [];
  }
  return files;
}

async function loadFiles(
  paths: readonly string[],
): Promise<readonly { absolutePath: string; source: string }[]> {
  const loaded = [];
  for (const absolutePath of paths) {
    loaded.push({
      absolutePath,
      source: await Deno.readTextFile(absolutePath),
    });
  }
  return loaded;
}

Deno.test("collect-edges: writes the repo's import graph to edges.jsonl", async () => {
  const paths = (await Promise.all(WALK_ROOTS.map(sourceFilesUnder))).flat();
  const files = await loadFiles(paths);
  const resolver = createResolver(`${REPO_ROOT}/deno.json`);
  const edges = buildEdges(REPO_ROOT, resolver, files);
  writeEdgesJsonl(OUTPUT_PATH, edges);
});
