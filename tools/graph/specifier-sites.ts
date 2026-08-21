function literalValue(node: Deno.lint.Expression): string | null {
  return node.type === "Literal" && typeof node.value === "string"
    ? node.value
    : null;
}

function pushIf(sites: string[], raw: string | null | undefined): void {
  if (typeof raw === "string") sites.push(raw);
}

function collectorPlugin(sites: string[]): Deno.lint.Plugin {
  return {
    name: "edge-collector",
    rules: {
      collect: {
        create(_context) {
          return {
            ImportDeclaration: (node) => pushIf(sites, node.source.value),
            ImportExpression: (node) =>
              pushIf(sites, literalValue(node.source)),
            ExportNamedDeclaration: (node) => pushIf(sites, node.source?.value),
            ExportAllDeclaration: (node) => pushIf(sites, node.source.value),
          };
        },
      },
    },
  };
}

/**
 * Every raw specifier text a file names as an edge source: static imports,
 * dynamic `import()` (literal-argument calls only -- a computed specifier
 * cannot be resolved statically, by construction), and re-export barrels
 * (`export {x} from`, `export * from`). `specifier-resolve.ts` resolves
 * each raw string identically regardless of which of these produced it, so
 * capturing all four here is what makes the graph's edges match what the
 * boundary checker itself would see.
 */
export function collectSpecifierSites(
  absolutePath: string,
  source: string,
): readonly string[] {
  const sites: string[] = [];
  Deno.lint.runPlugin(collectorPlugin(sites), absolutePath, source);
  return sites;
}
