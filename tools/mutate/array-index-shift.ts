import type { Site } from "../contracts/mutation";

function siteFor(node: Deno.lint.MemberExpression): Site | null {
  if (!node.computed || node.property.type !== "Literal") return null;
  const index = node.property.value;
  if (typeof index !== "number") return null;
  const replacement = String(index + 1);
  return {
    start: node.property.range[0],
    end: node.property.range[1],
    replacement,
    description: `index ${index} → ${replacement}`,
  };
}

function plugin(sites: Site[]): Deno.lint.Plugin {
  return {
    name: "array-index-shift",
    rules: {
      collect: {
        create() {
          return {
            MemberExpression: (node) => {
              const site = siteFor(node);
              if (site !== null) sites.push(site);
            },
          };
        },
      },
    },
  };
}

/** Shifts a computed numeric-literal array index by +1. */
export function arrayIndexShiftSites(
  source: string,
  filename: string,
): readonly Site[] {
  const sites: Site[] = [];
  Deno.lint.runPlugin(plugin(sites), filename, source);
  return sites;
}
