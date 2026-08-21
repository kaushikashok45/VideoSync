import type { Suppressor } from "./suppress";

declare namespace SemanticsReportContract {
  /** The smallest shape `reportAtNode` needs from an AST node: its own range. */
  interface RangedNode {
    readonly range: readonly [number, number];
  }

  /** The smallest shape `reportAtProgram` needs: a range plus its top-level statements. */
  interface ProgramNode extends RangedNode {
    readonly body: readonly RangedNode[];
  }

  /** Bundles a `reportAtNode` call's arguments into the one object every rule kit now takes. */
  interface ReportAtNodeArgs {
    readonly context: Deno.lint.RuleContext;
    readonly suppressor: Suppressor;
    readonly ruleId: string;
    readonly node: RangedNode;
    readonly message: string;
  }

  /** Bundles a `reportAtProgram` call's arguments, mirroring `ReportAtNodeArgs`. */
  interface ReportAtProgramArgs {
    readonly context: Deno.lint.RuleContext;
    readonly suppressor: Suppressor;
    readonly ruleId: string;
    readonly node: ProgramNode;
    readonly message: string;
  }
}

export = SemanticsReportContract;
