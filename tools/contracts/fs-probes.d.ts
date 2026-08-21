declare namespace FsProbesContract {
  /** Memoized, slice-level filesystem facts. */
  interface SliceProbe {
    readonly hasIndex: boolean;
    readonly hasContract: boolean;
    readonly publicExportCount: number; // -1 when index absent
  }
}

export = FsProbesContract;
