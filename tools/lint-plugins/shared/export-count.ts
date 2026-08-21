function bindingCount(
  declaration: Deno.lint.ExportNamedDeclaration["declaration"],
): number {
  if (declaration === null) return 0;
  if (declaration.type === "VariableDeclaration") {
    return declaration.declarations.length;
  }
  return 1;
}

/** Re-export specifiers count as their own bindings; a plain declaration counts its names. */
function namedExportCount(node: Deno.lint.ExportNamedDeclaration): number {
  return node.specifiers.length > 0
    ? node.specifiers.length
    : bindingCount(node.declaration);
}

/**
 * `export * from ...` fan-out is a documented blind spot: the lint AST
 * cannot see how many bindings the re-exported module actually has, so it is
 * conservatively counted as exactly one rather than guessed at.
 */
function statementExportCount(statement: Deno.lint.Statement): number {
  if (statement.type === "ExportDefaultDeclaration") return 1;
  if (statement.type === "ExportNamedDeclaration") {
    return namedExportCount(statement);
  }
  if (statement.type === "ExportAllDeclaration") return 1;
  return 0;
}

/**
 * Counts a module's exported bindings from its top-level statements. Shared
 * by `one-public-export` (module-scoped cap of 1) and `public-surface-cap`
 * (an `index.ts`'s cap of 7) so the counting rule -- and its `export *`
 * blind spot -- exists exactly once.
 */
export function countProgramExports(
  body: readonly Deno.lint.Statement[],
): number {
  return body.reduce((total, stmt) => total + statementExportCount(stmt), 0);
}
