declare namespace SliceEdgeContract {
  /** A deduplicated, cross-slice edge: `from` imports `to`, both slice keys. */
  interface SliceEdge {
    readonly from: string;
    readonly to: string;
  }
}

export = SliceEdgeContract;
