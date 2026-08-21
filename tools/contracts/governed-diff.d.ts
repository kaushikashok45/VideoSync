declare namespace GovernedDiffContract {
  /** The D1 governed diff: the one command every scoping/hashing consumer uses. */
  interface GovernedDiff {
    readonly patch: string; // exact bytes
    readonly receiptKey: string; // sha256(patch)
    readonly changedFiles: readonly string[]; // repo-relative
    readonly addedFiles: readonly string[]; // for contract-first + new-path checks
  }
}

export = GovernedDiffContract;
