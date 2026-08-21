declare namespace MutationContract {
  /** One point in a source file where an operator can substitute text. */
  interface Site {
    readonly start: number;
    readonly end: number;
    readonly replacement: string;
    readonly description: string;
  }

  /** A whole mutated file, produced by replacing one `Site`. */
  interface Mutant {
    readonly description: string;
    readonly source: string;
  }

  /** How a single mutant was disposed of. */
  type MutantVerdict = "survived" | "killed" | "killed-by-types";

  /** The tally and diagnosability record for one mutated file. */
  interface FileMutationResult {
    readonly file: string;
    readonly generated: number;
    readonly killed: number;
    readonly killedByTypes: number;
    readonly survived: number;
    readonly harnessError: boolean;
    readonly testFiles: readonly string[];
  }

  /** The whole run's outcome: every file's result plus the decided exit code. */
  interface MutationRun {
    readonly exitCode: number;
    readonly results: readonly FileMutationResult[];
  }
}

export = MutationContract;
