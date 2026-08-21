import { dirname, resolve as resolvePath } from "node:path";
import type { ResolvedSpecifier } from "../../contracts/specifier-resolve";
import { ignoreExpectedFailure } from "./ignore-expected-failure.ts";

interface AliasEntry {
  readonly prefix: string;
  readonly targetDir: string;
}

const CANDIDATE_SUFFIXES = ["", ".ts", ".tsx", "/index.ts", "/index.tsx"];

function isBareAlias(value: string): boolean {
  return value.startsWith("npm:") || value.startsWith("jsr:");
}

function aliasEntriesFrom(
  imports: Record<string, string>,
  repoRoot: string,
): AliasEntry[] {
  const entries: AliasEntry[] = [];
  for (const [key, value] of Object.entries(imports)) {
    if (!key.endsWith("/") || isBareAlias(value)) continue;
    entries.push({ prefix: key, targetDir: resolvePath(repoRoot, value) });
  }
  return entries;
}

function readAliasTable(denoJsonPath: string): readonly AliasEntry[] {
  const repoRoot = dirname(denoJsonPath);
  let config: { imports?: Record<string, string> };
  try {
    config = JSON.parse(Deno.readTextFileSync(denoJsonPath));
  } catch (error) {
    ignoreExpectedFailure(error);
    return [];
  }
  return aliasEntriesFrom(config.imports ?? {}, repoRoot);
}

function firstExistingFile(base: string): string | null {
  for (const suffix of CANDIDATE_SUFFIXES) {
    const candidate = `${base}${suffix}`;
    try {
      if (Deno.statSync(candidate).isFile) return candidate;
    } catch (error) {
      ignoreExpectedFailure(error); // try the next candidate
    }
  }
  return null;
}

function bareNameOf(raw: string): string {
  const segments = raw.split("/");
  return raw.startsWith("@") ? segments.slice(0, 2).join("/") : segments[0];
}

function resolveRelative(raw: string, fromFile: string): ResolvedSpecifier {
  const base = resolvePath(dirname(fromFile), raw);
  const absolutePath = firstExistingFile(base);
  return {
    raw,
    kind: absolutePath === null ? "unresolvable" : "relative",
    absolutePath,
    bareName: null,
  };
}

function resolveAlias(raw: string, alias: AliasEntry): ResolvedSpecifier {
  const base = resolvePath(alias.targetDir, raw.slice(alias.prefix.length));
  const absolutePath = firstExistingFile(base);
  return {
    raw,
    kind: absolutePath === null ? "unresolvable" : "alias",
    absolutePath,
    bareName: null,
  };
}

function resolveBare(raw: string): ResolvedSpecifier {
  return { raw, kind: "bare", absolutePath: null, bareName: bareNameOf(raw) };
}

/**
 * Creates a raw-specifier resolver whose alias table is read once from
 * `denoJsonPath`. `raw` is always preserved verbatim; resolution tries, in
 * order, the exact path, `+.ts`, `+.tsx`, `/index.ts`, `/index.tsx` --
 * mirroring `sloppyImports`.
 */
export function createResolver(denoJsonPath: string): {
  resolve(raw: string, fromFile: string): ResolvedSpecifier;
} {
  const aliases = readAliasTable(denoJsonPath);
  return {
    resolve(raw, fromFile) {
      if (raw.startsWith("./") || raw.startsWith("../")) {
        return resolveRelative(raw, fromFile);
      }
      const alias = aliases.find((entry) => raw.startsWith(entry.prefix));
      if (alias) return resolveAlias(raw, alias);
      return resolveBare(raw);
    },
  };
}
