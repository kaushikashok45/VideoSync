declare namespace IdentityContract {
  /** The AST-visible facts a lint rule can gather about a candidate violation. */
  interface ViolationSite {
    readonly ruleId: string; // "<plugin>/<rule>"
    readonly enclosingFunction: string; // "" for file- or slice-level rules
    readonly paramCount: number; // -1 when not applicable
    readonly bodyFingerprint: string; // hash of the first 3 non-blank statements
    readonly sliceKey: string | null; // set for slice-level rules only
  }
}

export = IdentityContract;
