import { fingerprintStatements } from "./body-fingerprint.ts";
import type {
  BlockBody,
  FunctionBody,
  FunctionDescriptor,
  FunctionLike,
  NameSource,
  RangedNode,
} from "../../contracts/function-node";

function isBlockBody(body: FunctionBody): body is BlockBody {
  return body.type === "BlockStatement";
}

interface SourceReader {
  getText(node?: RangedNode): string;
  readonly text: string;
}

const ANONYMOUS = "<anonymous>";

function nameOf(source: NameSource | null | undefined): string {
  return source?.type === "Identifier" && source.name ? source.name : ANONYMOUS;
}

function nameFromParent(node: FunctionLike): string {
  if (
    node.parent.type === "MethodDefinition" || node.parent.type === "Property"
  ) {
    return nameOf(node.parent.key);
  }
  if (node.parent.type === "VariableDeclarator") {
    return nameOf(node.parent.id);
  }
  return ANONYMOUS;
}

function functionName(node: FunctionLike): string {
  if (node.id?.name) return node.id.name;
  return nameFromParent(node);
}

function lineCount(text: string): number {
  return text.length === 0 ? 0 : text.split("\n").length;
}

function bodyStatements(body: FunctionBody | null): readonly RangedNode[] {
  if (body === null) return [];
  return isBlockBody(body) ? body.body : [body];
}

function bodyLineCount(
  body: FunctionBody | null,
  source: SourceReader,
): number {
  if (body === null) return 0;
  const lines = lineCount(source.getText(body));
  // A block's own text includes its opening and closing brace lines; the
  // limit counts the body only, excluding both.
  return isBlockBody(body) ? Math.max(lines - 2, 0) : lines;
}

/** Derives the identity-relevant, human-readable facts about a function node. */
export function describeFunction(
  node: FunctionLike,
  source: SourceReader,
): FunctionDescriptor {
  return {
    name: functionName(node),
    paramCount: node.params.length,
    bodyLineCount: bodyLineCount(node.body, source),
    bodyFingerprint: fingerprintStatements(
      bodyStatements(node.body),
      source.text,
    ),
  };
}
