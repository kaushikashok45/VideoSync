import type { Site } from "../contracts/mutation";

function negationSite(source: string, test: Deno.lint.Expression): Site {
  const inner = source.slice(test.range[0], test.range[1]);
  return {
    start: test.range[0],
    end: test.range[1],
    replacement: `!(${inner})`,
    description: "condition negated",
  };
}

function plugin(sites: Site[], source: string): Deno.lint.Plugin {
  const push = (test: Deno.lint.Expression) =>
    sites.push(negationSite(source, test));
  return {
    name: "condition-negation",
    rules: {
      collect: {
        create() {
          return {
            IfStatement: (node) => push(node.test),
            WhileStatement: (node) => push(node.test),
            ConditionalExpression: (node) => push(node.test),
          };
        },
      },
    },
  };
}

/** Wraps an `if`/`while`/ternary condition in `!( ... )`. */
export function conditionNegationSites(
  source: string,
  filename: string,
): readonly Site[] {
  const sites: Site[] = [];
  Deno.lint.runPlugin(plugin(sites, source), filename, source);
  return sites;
}
