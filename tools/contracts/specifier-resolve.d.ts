declare namespace SpecifierResolveContract {
  /** The result of resolving one raw import specifier from one file. */
  interface ResolvedSpecifier {
    readonly raw: string; // specifier text, preserved verbatim
    readonly kind: "relative" | "alias" | "bare" | "unresolvable";
    readonly absolutePath: string | null; // null for bare npm/jsr specifiers
    readonly bareName: string | null; // "socket.io-client" etc.
  }
}

export = SpecifierResolveContract;
