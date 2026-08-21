import type { Site } from "../contracts/mutation";

function siteFor(node: Deno.lint.Literal): Site | null {
  if (typeof node.value !== "number") return null;
  const replacement = String(node.value + 1);
  return {
    start: node.range[0],
    end: node.range[1],
    replacement,
    description: `${node.value} → ${replacement}`,
  };
}

function plugin(sites: Site[]): Deno.lint.Plugin {
  return {
    name: "numeric-off-by-one",
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

/** Replaces a numeric literal `n` with `n + 1`. */
export function numericOffByOneSites(
  source: string,
  filename: string,
): readonly Site[] {
  const sites: Site[] = [];
  Deno.lint.runPlugin(plugin(sites), filename, source);
  return sites;
}
