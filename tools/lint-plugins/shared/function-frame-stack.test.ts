import { assertEquals, assertThrows } from "@std/assert";
import { createFrameStack } from "./function-frame-stack.ts";

Deno.test("happy: a fresh frame starts at complexity 1 and depth 0", () => {
  const stack = createFrameStack<string>();
  stack.push("fn");
  const frame = stack.pop();
  assertEquals(frame.complexity, 1);
  assertEquals(frame.maxNestingDepth, 0);
});

Deno.test("happy: addComplexity accumulates on the current frame", () => {
  const stack = createFrameStack<string>();
  stack.push("fn");
  stack.addComplexity(1);
  stack.addComplexity(1);
  const frame = stack.pop();
  assertEquals(frame.complexity, 3);
});

Deno.test("sad: pop without a matching push throws rather than returning a bogus frame", () => {
  const stack = createFrameStack<string>();
  assertThrows(() => stack.pop());
});

Deno.test("edge: nesting depth tracks the deepest point reached, not the final one", () => {
  const stack = createFrameStack<string>();
  stack.push("fn");
  stack.enterNesting();
  stack.enterNesting();
  stack.exitNesting();
  const frame = stack.pop();
  assertEquals(frame.maxNestingDepth, 2);
});

Deno.test("edge: addComplexity/enterNesting before any push is a no-op, not a crash", () => {
  const stack = createFrameStack<string>();
  stack.addComplexity(1);
  stack.enterNesting();
  stack.exitNesting();
  stack.push("fn");
  const frame = stack.pop();
  assertEquals(frame.complexity, 1);
  assertEquals(frame.maxNestingDepth, 0);
});

Deno.test("mutation-guard: a nested function's complexity does not fold into its parent's frame", () => {
  const stack = createFrameStack<string>();
  stack.push("parent");
  stack.addComplexity(1); // parent has one decision point so far
  stack.push("child");
  stack.addComplexity(1);
  stack.addComplexity(1); // child racks up 2 more decision points
  const child = stack.pop();
  const parent = stack.pop();
  assertEquals(child.complexity, 3); // 1 base + 2
  assertEquals(parent.complexity, 2); // 1 base + 1, untouched by the child
});

Deno.test("mutation-guard: a nested function's nesting depth does not carry into its own frame", () => {
  const stack = createFrameStack<string>();
  stack.push("parent");
  stack.enterNesting();
  stack.enterNesting(); // parent is 2 levels deep when the child starts
  stack.push("child");
  stack.enterNesting(); // child's own nesting starts fresh at 0
  const child = stack.pop();
  stack.exitNesting();
  stack.exitNesting();
  const parent = stack.pop();
  assertEquals(child.maxNestingDepth, 1);
  assertEquals(parent.maxNestingDepth, 2);
});

Deno.test("logical-limits: frames pop in LIFO order and report their own node", () => {
  const stack = createFrameStack<string>();
  stack.push("outer");
  stack.push("inner");
  const inner = stack.pop();
  const outer = stack.pop();
  assertEquals(inner.node, "inner");
  assertEquals(outer.node, "outer");
});
