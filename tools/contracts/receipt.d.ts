declare namespace ReceiptContract {
  /** The subset of a `/review-now` receipt the commit gate actually reads. */
  interface ReviewReceipt {
    readonly key: string;
    readonly verdict: string;
  }
}

export = ReceiptContract;
