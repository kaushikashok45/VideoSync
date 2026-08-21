declare namespace EntityOriginContract {
  /** Value-import-only: binds imported local names to their resolved module. */
  interface EntityOriginTracker {
    /**
     * The resolved absolute module path `localName` was value-imported from
     * in the file `context` is currently linting, or `null` when the name
     * is not a value import in this file (locally declared, a type-only
     * import, or the specifier did not resolve to a file on disk).
     */
    originOf(
      context: Deno.lint.RuleContext,
      localName: string,
    ): string | null;
  }
}

export = EntityOriginContract;
