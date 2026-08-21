declare namespace SuppressContract {
  /** The committed ratchet baseline. */
  interface Baseline {
    readonly version: 1;
    readonly generatedAt: string;
    readonly paths: readonly string[]; // repo-relative path set
    readonly violations: Readonly<Record<string, number>>; // identity -> count
    readonly perFile: Readonly<Record<string, number>>; // path -> total count
  }

  /** A baseline-aware diagnostic gate. Fails closed on any load problem. */
  interface Suppressor {
    readonly loaded: boolean; // false => fail closed, suppress nothing
    isKnown(path: string, identity: string): boolean;
  }
}

export = SuppressContract;
