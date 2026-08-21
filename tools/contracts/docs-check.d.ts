declare namespace DocsCheck {
  interface Section {
    readonly heading: string;
    readonly level: number;
    readonly rawText: string;
  }

  interface BoundProof {
    readonly kind: "bound";
    readonly file: string;
    readonly tests: readonly string[];
  }

  interface PendingProof {
    readonly kind: "pending";
  }

  interface MalformedProof {
    readonly kind: "malformed";
    readonly raw: string;
  }

  type ProvenBy = BoundProof | PendingProof | MalformedProof;

  interface ErdResult {
    readonly bound: number;
    readonly pending: number;
    readonly drift: number;
    readonly driftDetails: readonly string[];
    readonly failures: readonly string[];
  }

  interface LcovRecord {
    readonly file: string;
    readonly linesFound: number;
    readonly linesHit: number;
    readonly branchesFound: number;
    readonly branchesHit: number;
  }

  interface InvariantResult {
    readonly bound: number;
    readonly pending: number;
    readonly failures: readonly string[];
  }

  interface EntityCheckResult {
    readonly bound: number;
    readonly pending: number;
    readonly driftDetails: readonly string[];
    readonly failures: readonly string[];
  }

  type FeatureFiles = ReadonlyMap<string, string>;

  interface CapabilityTraceContext {
    readonly prd: string;
    readonly design: string;
    readonly hld: string;
    readonly spec: string;
    readonly activePhase: number;
    readonly deliveryText: string;
  }

  interface GrandfatheredTerm {
    readonly term: string;
    readonly evidenceText: string;
  }

  interface Ontology {
    readonly canonicalBanned: readonly string[];
    readonly distinctTerms: readonly string[];
    readonly grandfathered: readonly GrandfatheredTerm[];
  }

  interface TermCount {
    readonly term: string;
    readonly totalCount: number;
    readonly files: readonly string[];
  }

  type TerminologyBaseline = Readonly<Record<string, number>>;
}

export = DocsCheck;
