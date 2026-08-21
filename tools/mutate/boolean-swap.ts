import type { Site } from "../contracts/mutation";

function siteFor(node: Deno.lint.Literal): Site | null {
  if (node.value !== true && node.value !== false) return null;
  const replacement = node.value ? "false" : "true";
  return {
    start: node.range[0],
    end: node.range[1],
    replacement,
    description: `${String(node.value)} → ${replacement}`,
  };
}

function plugin(sites: Site[]): Deno.lint.Plugin {
  return {
    name: "boolean-swap",
    rules: {
      collect: {
        create() {
          return {
            Literal: (node) => {
              const site = siteFor(node);
              if (site !== null) sites.push(site);
            },
          };
        },
      },
    },
  };
}

/** Flips a boolean literal. */
export function booleanSwapSites(
  source: string,
  filename: string,
): readonly Site[] {
  const sites: Site[] = [];
  Deno.lint.runPlugin(plugin(sites), filename, source);
  return sites;
}
