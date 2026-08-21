declare namespace FunctionNodeContract {
  /** The smallest shape a name can come from: an AST `Identifier`. */
  interface NameSource {
    readonly type: string;
    readonly name?: string;
  }

  /** The parent shapes `describeFunction` inspects to recover an anonymous function's name. */
  interface FunctionParent {
    readonly type: string;
    readonly key?: NameSource | null;
    readonly id?: NameSource | null;
  }

  interface RangedNode {
    readonly range: readonly [number, number];
  }

  interface BlockBody extends RangedNode {
    readonly type: "BlockStatement";
    readonly body: readonly RangedNode[];
  }

  interface ExpressionBody extends RangedNode {
    readonly type: string;
  }

  type FunctionBody = BlockBody | ExpressionBody;

  /** The minimal shape `describeFunction` needs -- real Deno.lint function nodes satisfy it structurally. */
  interface FunctionLike {
    readonly id: NameSource | null;
    readonly params: readonly unknown[];
    readonly parent: FunctionParent;
    readonly body: FunctionBody | null;
  }

  interface FunctionDescriptor {
    readonly name: string;
    readonly paramCount: number;
    readonly bodyLineCount: number;
    readonly bodyFingerprint: string;
  }
}

export = FunctionNodeContract;
