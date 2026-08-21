import { ignoreExpectedFailure } from "../lint-plugins/shared/ignore-expected-failure.ts";

function isSkippable(name: string): boolean {
  return name.startsWith(".") || name === "node_modules";
}

function isSourceFile(entry: Deno.DirEntry): boolean {
  return entry.isFile && /\.tsx?$/.test(entry.name);
}

function pushEntry(
  dir: string,
  entry: Deno.DirEntry,
  stack: string[],
  files: string[],
): void {
  if (isSkippable(entry.name)) return;
  const full = `${dir}/${entry.name}`;
  if (entry.isDirectory) stack.push(full);
  if (isSourceFile(entry)) files.push(full);
}

function collectDir(dir: string, stack: string[], files: string[]): void {
  let entries: Deno.DirEntry[];
  try {
    entries = Array.from(Deno.readDirSync(dir));
  } catch (error) {
    ignoreExpectedFailure(error);
    return;
  }
  for (const entry of entries) pushEntry(dir, entry, stack, files);
}

/**
 * Every `.ts`/`.tsx` file under `dir`, walked with an explicit stack (never
 * throws on a missing directory -- fails closed to an empty list, matching
 * `read-edges.ts`'s documented fail-to-empty contract).
 */
export function sourceFilesUnder(dir: string): readonly string[] {
  const files: string[] = [];
  const stack = [dir];
  while (stack.length > 0) {
    const current = stack.pop();
    if (current !== undefined) collectDir(current, stack, files);
  }
  return files;
}
