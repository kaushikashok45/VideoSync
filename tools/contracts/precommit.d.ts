declare namespace PrecommitContract {
  type Scope = "changed" | "all";

  /** One `deno task precommit` step: a name for reporting, a `deno` argv. */
  interface Step {
    readonly name: string;
    readonly command: readonly string[];
  }

  /** What running one step produced. */
  interface StepOutcome {
    readonly ok: boolean;
    readonly output: string;
  }

  /** The outcome of running an ordered step list fail-fast. */
  interface StepsResult {
    readonly ok: boolean;
    readonly failedStep: string | null;
    readonly output: string;
  }

  type StepRunner = (step: Step) => StepOutcome;

  /**
   * `pre-commit-hook.ts`'s injectable seams: the real implementations shell
   * out to git / `deno task precommit`, while tests substitute fakes for
   * the expensive step (re-running `precommit`) while keeping the real
   * receipt-lookup and diff-hashing logic under test.
   */
  interface PreCommitDeps {
    readonly receiptKey: () => string;
    readonly hasReceipt: (repoRoot: string, receiptKey: string) => boolean;
    readonly runPrecommitTask: (repoRoot: string) => StepOutcome;
    readonly writeMarker: (repoRoot: string, gitDir: string) => void;
  }
}

export = PrecommitContract;
