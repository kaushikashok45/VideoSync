import type { Baseline } from "./suppress";

declare namespace BaselineGenerateContract {
  /** One raw violation instance captured during a full-tree scan, before aggregation. */
  interface RawViolation {
    readonly path: string; // repo-relative
    readonly identity: string;
    readonly ruleId: string; // "<plugin>/<rule>"
  }

  /** Aggregated counts derived from a `RawViolation[]` scan. */
  interface ViolationCounts {
    readonly violations: Readonly<Record<string, number>>; // identity -> count
    readonly perFile: Readonly<Record<string, number>>; // path -> count
    readonly perRule: Readonly<Record<string, number>>; // ruleId -> count
  }

  /** One increase the frozen-budget check found, for the refusal message and log. */
  interface CountIncrease {
    readonly kind: "identity" | "file" | "rule";
    readonly key: string;
    readonly previous: number;
    readonly current: number;
  }

  /** One `baseline:regen` invocation, appended to the baseline's own log. */
  interface RegenLogEntry {
    readonly at: string; // ISO timestamp
    readonly allowedIncrease: boolean;
    readonly reason: string | null;
  }

  /**
   * `Baseline` plus the fields only the generator cares about. The
   * suppressor's `isValidBaseline` only checks the fields it needs, so a
   * `PersistedBaseline` is always a valid `Baseline` too.
   */
  interface PersistedBaseline extends Baseline {
    readonly perRule: Readonly<Record<string, number>>;
    readonly log: readonly RegenLogEntry[];
  }

  /** Options controlling whether `baseline:regen` may proceed despite increases. */
  interface RegenOptions {
    readonly allowIncrease: boolean;
    readonly reason: string | null;
  }

  /** A loaded, unparsed source file ready to be scanned. */
  interface LoadedFile {
    readonly absolutePath: string;
    readonly source: string;
  }

  /** The generator's verdict: either the baseline to write, or a refusal listing every increase found. */
  type RegenResult =
    | { readonly ok: true; readonly baseline: PersistedBaseline }
    | { readonly ok: false; readonly increases: readonly CountIncrease[] };
}

export = BaselineGenerateContract;
