import { sourceFilesUnder } from "./source-files.ts";

interface DynamicImportSite {
  readonly file: string;
  readonly line: number;
}

function isLiteral(node: Deno.lint.Expression): boolean {
  return node.type === "Literal" && typeof node.value === "string";
}

function lineOf(source: string, offset: number): number {
  return source.slice(0, offset).split("\n").length;
}

function plugin(
  sites: DynamicImportSite[],
  file: string,
  source: string,
): Deno.lint.Plugin {
  return {
    name: "dynamic-import-sites",
    rules: {
      collect: {
        create() {
          return {
            ImportExpression: (node) => {
              if (isLiteral(node.source)) return;
              sites.push({ file, line: lineOf(source, node.range[0]) });
            },
          };
        },
      },
    },
  };
}

function sitesInFile(
  absolutePath: string,
  repoRoot: string,
): readonly DynamicImportSite[] {
  const relative = absolutePath.slice(repoRoot.length + 1);
  const source = Deno.readTextFileSync(absolutePath);
  const sites: DynamicImportSite[] = [];
  Deno.lint.runPlugin(plugin(sites, relative, source), absolutePath, source);
  return sites;
}

/**
 * Every dynamic `import()` under `walkRoots` whose specifier is not a
 * string literal -- the one class of import-graph edge
 * `tools/graph/specifier-sites.ts` cannot resolve, since a computed
 * specifier has no statically-known target.
 */
export function nonLiteralDynamicImportSites(
  repoRoot: string,
  walkRoots: readonly string[],
): readonly DynamicImportSite[] {
  const sites: DynamicImportSite[] = [];
  for (const root of walkRoots) {
    for (const file of sourceFilesUnder(`${repoRoot}/${root}`)) {
      sites.push(...sitesInFile(file, repoRoot));
    }
  }
  return sites;
}
