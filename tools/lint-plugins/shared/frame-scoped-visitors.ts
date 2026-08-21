import { createFrameStack } from "./function-frame-stack.ts";
import type { FunctionNode } from "../../contracts/frame-scoped-visitors";

/**
 * Not exported: nothing outside this file needs the frame-stack type,
 * only the `FunctionNode` node-kind union it is parameterised over
 * (`tools/contracts/frame-scoped-visitors.d.ts`) [why](docs/DECISIONS.md#ad-011).
 */
type FrameStack = ReturnType<typeof createFrameStack<FunctionNode>>;

/**
 * The AST wiring shared by the complexity and nesting-depth rules: both walk
 * the same decision-point and nesting node set and both need a fresh frame
 * per function, differing only in which frame field they read on exit
 * (FLOW.md Step 5). Nested function expressions push their own frame, so
 * their decision points and nesting never fold into the enclosing frame.
 */
function functionFrameVisitors(
  stack: FrameStack,
  onExit: (node: FunctionNode) => void,
) {
  const enter = (node: FunctionNode) => stack.push(node);
  return {
    FunctionDeclaration: enter,
    "FunctionDeclaration:exit": onExit,
    FunctionExpression: enter,
    "FunctionExpression:exit": onExit,
    ArrowFunctionExpression: enter,
    "ArrowFunctionExpression:exit": onExit,
  };
}

function complexityOnlyVisitors(stack: FrameStack) {
  const addComplexity = () => stack.addComplexity(1);
  return {
    ConditionalExpression: addComplexity,
    LogicalExpression: addComplexity,
    SwitchCase: addComplexity,
  };
}

function branchingVisitors(stack: FrameStack) {
  const branchAndNest = () => {
    stack.addComplexity(1);
    stack.enterNesting();
  };
  const exitNesting = () => stack.exitNesting();
  return {
    IfStatement: branchAndNest,
    ForStatement: branchAndNest,
    ForInStatement: branchAndNest,
    ForOfStatement: branchAndNest,
    WhileStatement: branchAndNest,
    DoWhileStatement: branchAndNest,
    "IfStatement:exit": exitNesting,
    "ForStatement:exit": exitNesting,
    "ForInStatement:exit": exitNesting,
    "ForOfStatement:exit": exitNesting,
    "WhileStatement:exit": exitNesting,
    "DoWhileStatement:exit": exitNesting,
  };
}

function nestingOnlyVisitors(stack: FrameStack) {
  const enterNesting = () => stack.enterNesting();
  const exitNesting = () => stack.exitNesting();
  return {
    SwitchStatement: enterNesting,
    CatchClause: enterNesting,
    "SwitchStatement:exit": exitNesting,
    "CatchClause:exit": exitNesting,
  };
}

export function frameScopedVisitors(
  stack: FrameStack,
  onExit: (node: FunctionNode) => void,
): Deno.lint.LintVisitor {
  return {
    ...functionFrameVisitors(stack, onExit),
    ...complexityOnlyVisitors(stack),
    ...branchingVisitors(stack),
    ...nestingOnlyVisitors(stack),
  };
}
