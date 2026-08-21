import type { Site } from "../contracts/mutation";

const OPERATORS: Readonly<Record<string, string>> = {
  "===": "!==",
  "!==": "===",
  ">=": ">",
  ">": ">=",
  "<=": "<",
  "<": "<=",
};

function siteFor(
  source: string,
  node: Deno.lint.BinaryExpression,
): Site | null {
  const replacement = OPERATORS[node.operator];
  if (replacement === undefined) return null;
  const leftEnd = node.left.range[1] - node.range[0];
  const text = source.slice(node.range[0], node.range[1]);
  const operatorStart = text.indexOf(node.operator, leftEnd);
  if (operatorStart < 0) return null;
  const start = node.range[0] + operatorStart;
  return {
    start,
    end: start + node.operator.length,
    replacement,
    description: `${node.operator} → ${replacement}`,
  };
}

function plugin(sites: Site[], source: string): Deno.lint.Plugin {
  return {
    name: "comparison-flip",
    rules: {
      collect: {
        create() {
          return {
            BinaryExpression: (node) => {
              const site = siteFor(source, node);
              if (site !== null) sites.push(site);
            },
          };
        },
      },
    },
  };
}

/** Flips a relational/equality operator to its listed counterpart. */
export function comparisonFlipSites(
  source: string,
  filename: string,
): readonly Site[] {
  const sites: Site[] = [];
  Deno.lint.runPlugin(plugin(sites, source), filename, source);
  return sites;
}
