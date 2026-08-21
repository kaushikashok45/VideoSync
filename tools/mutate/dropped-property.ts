import type { Site } from "../contracts/mutation";

type Member = Deno.lint.ObjectExpression["properties"][number];

function removalRange(
  node: Deno.lint.ObjectExpression,
  members: readonly Member[],
  index: number,
): { start: number; end: number } {
  const isLast = index === members.length - 1;
  if (!isLast) {
    return { start: members[index].range[0], end: members[index + 1].range[0] };
  }
  const start = index > 0 ? members[index - 1].range[1] : node.range[0] + 1;
  return { start, end: members[index].range[1] };
}

function sitesForObject(
  source: string,
  node: Deno.lint.ObjectExpression,
): Site[] {
  const members = node.properties;
  return members.map((_member, index) => {
    const range = removalRange(node, members, index);
    return {
      start: range.start,
      end: range.end,
      replacement: "",
      description: `dropped property at index ${index}: ${
        source.slice(members[index].range[0], members[index].range[1])
      }`,
    };
  });
}

function objectArgs(
  node: Deno.lint.CallExpression,
): readonly Deno.lint.ObjectExpression[] {
  return node.arguments.filter(
    (arg): arg is Deno.lint.ObjectExpression => arg.type === "ObjectExpression",
  );
}

function plugin(sites: Site[], source: string): Deno.lint.Plugin {
  return {
    name: "dropped-property",
    rules: {
      collect: {
        create() {
          return {
            CallExpression: (node) => {
              for (const objectExpression of objectArgs(node)) {
                sites.push(...sitesForObject(source, objectExpression));
              }
            },
          };
        },
      },
    },
  };
}

/** Drops one property from an object-literal call argument, per property. */
export function droppedPropertySites(
  source: string,
  filename: string,
): readonly Site[] {
  const sites: Site[] = [];
  Deno.lint.runPlugin(plugin(sites, source), filename, source);
  return sites;
}
