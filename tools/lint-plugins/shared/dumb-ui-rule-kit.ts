import { classify } from "./fsd-path.ts";
import { reportViolation } from "./report-violation.ts";
import { fingerprintStatements } from "./body-fingerprint.ts";
import type { Suppressor } from "../../contracts/suppress";
import type { FsdPath } from "../../contracts/fsd-path";

interface RangedNode {
  readonly range: readonly [number, number];
}

/** A per-site violation report, bundled so `reportAtNode` stays within the ≤4-param budget it itself enforces. */
interface ReportAtNodeArgs {
  readonly context: Deno.lint.RuleContext;
  readonly suppressor: Suppressor;
  readonly ruleId: string;
  readonly node: RangedNode;
  readonly message: string;
}

interface DumbUiRuleKit {
  /**
   * Activates only for presentation files -- `classify().isPresentation` is
   * the sole authority [why](docs/DECISIONS.md#ad-004). Unlike
   * `boundary-rule-kit.forKnownFiles`, the legacy zone is deliberately NOT
   * exempted here: presentation is presentation regardless of directory name
   * (docs/GOVERNANCE.md, "why legacy components/ counts as presentation"),
   * so a legacy `components/foo.tsx` is in scope exactly like `ui/foo.tsx`.
   */
  forPresentationFiles(
    context: Deno.lint.RuleContext,
    build: (fsd: FsdPath) => Deno.lint.LintVisitor,
  ): Deno.lint.LintVisitor;
  /** Per-site violations: identity from the offending node's own text. */
  reportAtNode(args: ReportAtNodeArgs): void;
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

/** The `classify`-then-`reportViolation` wiring both dumb-ui rules share. */
export function createDumbUiRuleKit(repoRoot: string): DumbUiRuleKit {
  return {
    forPresentationFiles(context, build) {
      const fsd = classify(context.filename);
      return fsd.isPresentation ? build(fsd) : {};
    },
    reportAtNode: (args) => reportNodeViolation(repoRoot, args),
  };
}
