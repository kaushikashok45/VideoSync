declare namespace FrameScopedVisitorsContract {
  /** The three AST node kinds that get their own complexity/nesting frame. */
  type FunctionNode =
    | Deno.lint.FunctionDeclaration
    | Deno.lint.FunctionExpression
    | Deno.lint.ArrowFunctionExpression;
}

export = FrameScopedVisitorsContract;
