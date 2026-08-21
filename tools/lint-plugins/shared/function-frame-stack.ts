interface Frame<T> {
  readonly node: T;
  complexity: number;
  nestingDepth: number;
  maxNestingDepth: number;
}

interface FrameSummary<T> {
  readonly node: T;
  readonly complexity: number;
  readonly maxNestingDepth: number;
}

interface FrameStack<T> {
  push(node: T): void;
  pop(): FrameSummary<T>;
  addComplexity(weight: number): void;
  enterNesting(): void;
  exitNesting(): void;
}

function topFrame<T>(frames: readonly Frame<T>[]): Frame<T> | undefined {
  return frames[frames.length - 1];
}

function pushFrame<T>(frames: Array<Frame<T>>, node: T): void {
  frames.push({ node, complexity: 1, nestingDepth: 0, maxNestingDepth: 0 });
}

function popFrame<T>(frames: Array<Frame<T>>): FrameSummary<T> {
  const frame = frames.pop();
  if (frame === undefined) {
    throw new Error("frame stack underflow: pop() without a matching push()");
  }
  return {
    node: frame.node,
    complexity: frame.complexity,
    maxNestingDepth: frame.maxNestingDepth,
  };
}

function addComplexityTo<T>(frames: Array<Frame<T>>, weight: number): void {
  const frame = topFrame(frames);
  if (frame) frame.complexity += weight;
}

function enterNestingOn<T>(frames: Array<Frame<T>>): void {
  const frame = topFrame(frames);
  if (!frame) return;
  frame.nestingDepth += 1;
  frame.maxNestingDepth = Math.max(frame.maxNestingDepth, frame.nestingDepth);
}

function exitNestingOn<T>(frames: Array<Frame<T>>): void {
  const frame = topFrame(frames);
  if (frame) frame.nestingDepth -= 1;
}

/**
 * A stack of per-function scoring frames. Each `push` starts a fresh frame at
 * complexity 1 and nesting depth 0, so a nested function expression (a
 * callback, an inline arrow) is scored strictly against its own frame and
 * never folds into its enclosing function's count -- see FLOW.md Step 5.
 * `T` is generic so tests can push plain values instead of real AST nodes.
 */
export function createFrameStack<T>(): FrameStack<T> {
  const frames: Array<Frame<T>> = [];
  return {
    push: (node) => pushFrame(frames, node),
    pop: () => popFrame(frames),
    addComplexity: (weight) => addComplexityTo(frames, weight),
    enterNesting: () => enterNestingOn(frames),
    exitNesting: () => exitNestingOn(frames),
  };
}
