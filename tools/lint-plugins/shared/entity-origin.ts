import type { createResolver } from "./specifier-resolve.ts";
import type { EntityOriginTracker } from "../../contracts/entity-origin";

type Resolver = ReturnType<typeof createResolver>;
type Bindings = ReadonlyMap<string, string>;

/** Only a named `ImportSpecifier` can be individually type-only (`import { type Foo }`). */
function isValueImport(
  specifier: Deno.lint.ImportDeclaration["specifiers"][number],
): boolean {
  return specifier.type !== "ImportSpecifier" ||
    specifier.importKind === "value";
}

function resolvedOrigin(
  resolver: Resolver,
  context: Deno.lint.RuleContext,
  statement: Deno.lint.Statement,
): string | null {
  if (statement.type !== "ImportDeclaration") return null;
  if (statement.importKind === "type") return null;
  return resolver.resolve(statement.source.value, context.filename)
    .absolutePath;
}

function bindImportStatement(
  bindings: Map<string, string>,
  resolver: Resolver,
  context: Deno.lint.RuleContext,
  statement: Deno.lint.Statement,
): void {
  const origin = resolvedOrigin(resolver, context, statement);
  if (origin === null || statement.type !== "ImportDeclaration") return;
  for (const specifier of statement.specifiers.filter(isValueImport)) {
    bindings.set(specifier.local.name, origin);
  }
}

function bindingsFor(
  resolver: Resolver,
  context: Deno.lint.RuleContext,
): Bindings {
  const bindings = new Map<string, string>();
  for (const statement of context.sourceCode.ast.body) {
    bindImportStatement(bindings, resolver, context, statement);
  }
  return bindings;
}

/**
 * Shared once-per-file primitive: is a given identifier rooted in a module
 * this file imported, and if so which one. Computed lazily and memoized per
 * `context.filename` so the three rules that consume it (`no-demeter`,
 * `no-entity-interrogation`, `no-foreign-switch`) share one walk of the
 * file's imports instead of each re-deriving it.
 *
 * **Documented blind spot.** The lint AST carries no type information, so
 * this binds imported *value* names only. It catches a module that imports
 * an entity and interrogates it directly -- the common case -- but misses an
 * entity arriving as an un-annotated function parameter, a re-export, or a
 * value threaded through several local reassignments. That residue belongs
 * to the `reviewer-architecture` panel lens per `docs/GOVERNANCE.md`, not a
 * type-guessing heuristic here: a checker that silently under-reports a
 * documented edge is preferable to one that guesses at types it cannot see.
 */
export function createEntityOriginTracker(
  resolver: Resolver,
): EntityOriginTracker {
  const cache = new Map<string, Bindings>();
  return {
    originOf(context, localName) {
      let bindings = cache.get(context.filename);
      if (bindings === undefined) {
        bindings = bindingsFor(resolver, context);
        cache.set(context.filename, bindings);
      }
      return bindings.get(localName) ?? null;
    },
  };
}
