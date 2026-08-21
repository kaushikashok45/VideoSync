import { classify } from "./fsd-path.ts";
import { reportViolation } from "./report-violation.ts";
import { fingerprintStatements } from "./body-fingerprint.ts";
import type { Suppressor } from "../../contracts/suppress";
import type { FsdPath } from "../../contracts/fsd-path";

interface RangedNode {
  readonly range: readonly [number, number];
}

/** A per-edge violation report, bundled so `reportAtNode` stays within the ≤4-param budget it itself enforces. */
interface ReportAtNodeArgs {
  readonly context: Deno.lint.RuleContext;
  readonly suppressor: Suppressor;
  readonly ruleId: string;
  readonly node: RangedNode;
  readonly message: string;
}

/** A per-slice violation report, bundled for the same reason as `ReportAtNodeArgs`. */
interface ReportForSliceArgs extends ReportAtNodeArgs {
  readonly sliceRoot: string;
}

interface BoundaryRuleKit {
  /** Skips files outside FSD, `tools/**`, and the legacy zone -- none are boundary-governed. */
  forKnownFiles(
    context: Deno.lint.RuleContext,
    build: (fsd: FsdPath) => Deno.lint.LintVisitor,
  ): Deno.lint.LintVisitor;
  /** Per-edge violations: identity from the offending node's own text. */
  reportAtNode(args: ReportAtNodeArgs): void;
  /** Per-slice violations: identity keys on `sliceRoot`, never the anchor node [why](docs/DECISIONS.md#ad-009). */
  reportForSlice(args: ReportForSliceArgs): void;
}

function reportEdgeViolation(repoRoot: string, args: ReportAtNodeArgs): void {
  reportViolation({
    context: args.context,
    suppressor: args.suppressor,
    repoRoot,
    site: {
      ruleId: args.ruleId,
      enclosingFunction: "",
      paramCount: -1,
      bodyFingerprint: fingerprintStatements(
        [args.node],
        args.context.sourceCode.text,
      ),
      sliceKey: null,
    },
    range: args.node.range,
    message: args.message,
  });
}

function reportSliceViolation(
  repoRoot: string,
  args: ReportForSliceArgs,
): void {
  reportViolation({
    context: args.context,
    suppressor: args.suppressor,
    repoRoot,
    site: {
      ruleId: args.ruleId,
      enclosingFunction: "",
      paramCount: -1,
      bodyFingerprint: fingerprintStatements([], ""),
      sliceKey: args.sliceRoot,
    },
    range: args.node.range,
    message: args.message,
  });
}

/** The `classify`-then-`reportViolation` wiring every boundary rule shares. */
export function createBoundaryRuleKit(repoRoot: string): BoundaryRuleKit {
  return {
    forKnownFiles(context, build) {
      const fsd = classify(context.filename);
      const exempt = fsd.root === "outside" || fsd.root === "tools" ||
        fsd.isLegacyZone;
      return exempt ? {} : build(fsd);
    },
    reportAtNode: (args) => reportEdgeViolation(repoRoot, args),
    reportForSlice: (args) => reportSliceViolation(repoRoot, args),
  };
}
