declare namespace FsdRootContract {
  /** The four top-level markers `findRoot` knows how to locate. */
  type KnownRoot = "app" | "server" | "tools" | "contracts";

  /** Where a known root's marker was found in an absolute path's segments. */
  interface RootMatch {
    readonly root: KnownRoot;
    /** Index just past the root's own marker segment(s). */
    readonly markerEnd: number;
  }
}

export = FsdRootContract;
