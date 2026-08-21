declare namespace DenoLintJsonContract {
  /** One point in a diagnostic's range, as `deno lint --json` reports it. */
  interface LintPosition {
    readonly line: number;
    readonly col: number;
  }

  /** One finding from `deno lint --json`, built-in or plugin-sourced alike. */
  interface LintDiagnostic {
    readonly filename: string; // a `file://` URI
    readonly range: {
      readonly start: LintPosition;
      readonly end: LintPosition;
    };
    readonly message: string;
    readonly code: string; // "<plugin>/<rule>" for ours, bare for built-ins
    readonly hint: string | null;
  }

  /** The outcome of shelling out to `deno lint --json`: parsed diagnostics, or a harness-level failure to parse/run it. */
  type LintJsonResult =
    | { readonly ok: true; readonly diagnostics: readonly LintDiagnostic[] }
    | { readonly ok: false; readonly error: string };
}

export = DenoLintJsonContract;
