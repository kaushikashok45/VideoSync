declare namespace ImportEdgeContract {
  /**
   * One raw import/export-from/dynamic-import edge, resolved to an
   * absolute-on-disk target and classified by slice. Repo-relative paths so
   * the recorded graph survives a checkout at any location. `fromSlice`/
   * `toSlice` are `null` when the endpoint has no slice (e.g. `shared/**`).
   */
  interface ImportEdge {
    readonly from: string;
    readonly to: string;
    readonly fromSlice: string | null;
    readonly toSlice: string | null;
  }
}

export = ImportEdgeContract;
