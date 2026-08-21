import { classify } from "./fsd-path.ts";
import { reportViolation } from "./report-violation.ts";
import { describeFunction } from "./function-node.ts";
import type { Suppressor } from "../../contracts/suppress";
import type { FsdPath } from "../../contracts/fsd-path";
import type { FunctionNode } from "../../contracts/frame-scoped-visitors";

/** A per-function violation report, bundled so `report` stays within the ≤4-param budget it itself enforces. */
interface ReportArgs {
  readonly context: Deno.lint.RuleContext;
  readonly suppressor: Suppressor;
  readonly ruleId: string;
  readonly node: FunctionNode;
  readonly message: string;
}

interface StructuralRuleKit {
  /** Skips files `classify()` cannot place -- an unclassifiable file is not a violation. */
  forKnownFiles(
    context: Deno.lint.RuleContext,
    build: (fsd: FsdPath) => Deno.lint.LintVisitor,
  ): Deno.lint.LintVisitor;
  /** Runs the FLOW.md Step 6 gate for a per-function violation, naming it from the node itself. */
  report(args: ReportArgs): void;
}

function reportFunctionViolation(repoRoot: string, args: ReportArgs): void {
  const descriptor = describeFunction(args.node, args.context.sourceCode);
  reportViolation({
    context: args.context,
    suppressor: args.suppressor,
    repoRoot,
    site: {
      ruleId: args.ruleId,
      enclosingFunction: descriptor.name,
      paramCount: descriptor.paramCount,
      bodyFingerprint: descriptor.bodyFingerprint,
      sliceKey: null,
    },
    range: args.node.range,
    message: args.message,
  });
}

/** The `classify`-then-`reportViolation` wiring every function-scoped structural rule shares. */
export function createStructuralRuleKit(repoRoot: string): StructuralRuleKit {
  return {
    forKnownFiles(context, build) {
      const fsd = classify(context.filename);
      return fsd.root === "outside" ? {} : build(fsd);
    },
    report: (args) => reportFunctionViolation(repoRoot, args),
  };
}
