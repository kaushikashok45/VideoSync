import { governedDiff } from "./governed-diff.ts";
import { ignoreExpectedFailure } from "../lint-plugins/shared/ignore-expected-failure.ts";

const REPO_ROOT = new URL("../../", import.meta.url).pathname.replace(
  /\/$/,
  "",
);
const WALK_ROOTS = ["app", "server", "shared", "tools"];
const SOURCE_EXTENSION = /\.tsx?$/;

async function exists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch (error) {
    ignoreExpectedFailure(error);
    return false;
  }
}

function shouldSkipEntry(name: string): boolean {
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
    if (shouldSkipEntry(entry.name)) continue;
    yield* walkEntry(dir, entry);
  }
}

async function sourceFilesUnder(root: string): Promise<string[]> {
  const base = `${REPO_ROOT}/${root}`;
  if (!await exists(base)) return [];
  const files: string[] = [];
  for await (const path of walk(base)) {
    if (SOURCE_EXTENSION.test(path)) {
      files.push(path.slice(REPO_ROOT.length + 1));
    }
  }
  return files;
}

async function allSourceFiles(): Promise<readonly string[]> {
  const files: string[] = [];
  for (const root of WALK_ROOTS) {
    files.push(...await sourceFilesUnder(root));
  }
  return files;
}

function changedSourceFiles(): readonly string[] {
  return governedDiff().changedFiles.filter((path) =>
    SOURCE_EXTENSION.test(path)
  );
}

/**
 * Every `.ts`/`.tsx` path a `check-*.ts` CLI can be asked to scan, relative
 * to the repo root: `"all"` walks `app`/`server`/`shared`/`tools` fresh off
 * disk, `"changed"` reads the governed diff instead. Shared by every
 * `check-*.ts` CLI so the walk logic exists exactly once.
 */
export function scopedSourceFiles(
  scope: "changed" | "all",
): Promise<readonly string[]> | readonly string[] {
  return scope === "all" ? allSourceFiles() : changedSourceFiles();
}
