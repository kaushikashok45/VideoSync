import { classify } from "./fsd-path.ts";
import { reportViolation } from "./report-violation.ts";
import { fingerprintStatements } from "./body-fingerprint.ts";
import type { FsdPath } from "../../contracts/fsd-path";
import type {
  ProgramNode,
  ReportAtNodeArgs,
  ReportAtProgramArgs,
} from "../../contracts/semantics-report";

interface SemanticsRuleKit {
  /**
   * Skips only unclassifiable files -- an unclassifiable file is not a
   * violation. Unlike `boundary-rule-kit`, `tools/**` and the legacy zone
   * are deliberately NOT exempted here: per `docs/GOVERNANCE.md` the legacy
   * zone is "still ratcheted for structural limits", and Tier 2 rules are
   * structural-limit-shaped, not boundary-shaped -- only the boundary
   * checker itself carves the legacy zone and `tools/**` out.
   */
  forKnownFiles(
    context: Deno.lint.RuleContext,
    build: (fsd: FsdPath) => Deno.lint.LintVisitor,
  ): Deno.lint.LintVisitor;
  /** Per-site violations: identity from the offending node's own text. */
  reportAtNode(args: ReportAtNodeArgs): void;
  /**
   * Per-module violations (`one-public-export`, `no-default-export`):
   * identity from the file's first statements, mirroring
   * `structural/file-length`'s `Program`-anchored pattern.
   */
  reportAtProgram(args: ReportAtProgramArgs): void;
}

function reportNodeViolation(repoRoot: string, args: ReportAtNodeArgs): void {
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

function reportProgramViolation(
  repoRoot: string,
  args: ReportAtProgramArgs,
): void {
  const node: ProgramNode = args.node;
  reportViolation({
    context: args.context,
    suppressor: args.suppressor,
    repoRoot,
    site: {
      ruleId: args.ruleId,
      enclosingFunction: "",
      paramCount: -1,
      bodyFingerprint: fingerprintStatements(
        node.body,
        args.context.sourceCode.text,
      ),
      sliceKey: null,
    },
    range: node.range,
    message: args.message,
  });
}

/** The `classify`-then-`reportViolation` wiring every semantics rule shares. */
export function createSemanticsRuleKit(repoRoot: string): SemanticsRuleKit {
  return {
    forKnownFiles(context, build) {
      const fsd = classify(context.filename);
      return fsd.root === "outside" ? {} : build(fsd);
    },
    reportAtNode: (args) => reportNodeViolation(repoRoot, args),
    reportAtProgram: (args) => reportProgramViolation(repoRoot, args),
  };
}
