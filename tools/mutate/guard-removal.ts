import type { Site } from "../contracts/mutation";

function isBareReturn(statement: Deno.lint.Statement): boolean {
  return statement.type === "ReturnStatement";
}

function isGuardBody(consequent: Deno.lint.Statement): boolean {
  if (isBareReturn(consequent)) return true;
  return consequent.type === "BlockStatement" &&
    consequent.body.length === 1 &&
    isBareReturn(consequent.body[0]);
}

function isGuardClause(node: Deno.lint.IfStatement): boolean {
  return node.alternate === null && isGuardBody(node.consequent);
}

function plugin(sites: Site[]): Deno.lint.Plugin {
  return {
    name: "guard-removal",
    rules: {
      collect: {
        create() {
          return {
            IfStatement: (node) => {
              if (!isGuardClause(node)) return;
              sites.push({
                start: node.range[0],
                end: node.range[1],
                replacement: "",
                description: "guard clause removed",
              });
            },
          };
        },
      },
    },
  };
}

/** Deletes an `if (cond) return ...;` guard clause with no `else`. */
export function guardRemovalSites(
  source: string,
  filename: string,
): readonly Site[] {
  const sites: Site[] = [];
  Deno.lint.runPlugin(plugin(sites), filename, source);
  return sites;
}
