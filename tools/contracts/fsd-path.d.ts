declare namespace FsdPathContract {
  /** Which top-level root of the repository a file lives under. */
  type FsdRoot = "app" | "server" | "contracts" | "tools" | "outside";

  /** The slice-internal segment a file plays, per AGENTS.md's module layout. */
  type SliceRole =
    | "ui"
    | "model"
    | "api"
    | "lib"
    | "contracts"
    | "index"
    | "test"
    | "other";

  /** The structural classification of one absolute file path. */
  interface FsdPath {
    readonly root: FsdRoot;
    /** -1 for `contracts`; 0..5 for `app`; 0..3 for `server`; NaN otherwise. */
    readonly layer: number;
    readonly layerName: string;
    readonly slice: string | null;
    readonly sliceRoot: string | null;
    readonly role: SliceRole;
    readonly isPresentation: boolean;
    readonly isLegacyZone: boolean;
    readonly isTest: boolean;
  }
}

export = FsdPathContract;
