import { assertEquals } from "@std/assert";
import { describeFunction } from "./function-node.ts";
import type { FunctionLike } from "../../contracts/function-node";

const SRC = "function doThing(a, b) {\n  const x = 1;\n  return x;\n}\n";
//                                    ^25                          ^58 (block range)

function reader(text: string) {
  return {
    text,
    getText: (node?: { readonly range: readonly [number, number] }) =>
      node ? text.slice(node.range[0], node.range[1]) : text,
  };
}

function blockBody(
  range: readonly [number, number],
): { type: "BlockStatement"; range: readonly [number, number]; body: [] } {
  return { type: "BlockStatement", range, body: [] };
}

function describeWithName(
  name: string,
  body: FunctionLike["body"],
): ReturnType<typeof describeFunction> {
  return describeFunction(
    {
      id: { type: "Identifier", name },
      params: [],
      parent: { type: "Program" },
      body,
    },
    reader("{}"),
  );
}

Deno.test("happy: a named function declaration reports its own name", () => {
  const node: FunctionLike = {
    id: { type: "Identifier", name: "doThing" },
    params: [{}, {}],
    parent: { type: "Program" },
    body: blockBody([24, SRC.length - 1]),
  };
  const descriptor = describeFunction(node, reader(SRC));
  assertEquals(descriptor.name, "doThing");
  assertEquals(descriptor.paramCount, 2);
});

Deno.test("happy: an object destructured parameter still counts as exactly 1", () => {
  const node: FunctionLike = {
    id: null,
    params: [{ type: "ObjectPattern" }],
    parent: {
      type: "VariableDeclarator",
      id: { type: "Identifier", name: "handler" },
    },
    body: blockBody([0, 2]),
  };
  const descriptor = describeFunction(node, reader("{}"));
  assertEquals(descriptor.paramCount, 1);
});

Deno.test("sad: an anonymous callback with no naming parent reports <anonymous>", () => {
  const node: FunctionLike = {
    id: null,
    params: [],
    parent: { type: "CallExpression" },
    body: blockBody([0, 2]),
  };
  const descriptor = describeFunction(node, reader("{}"));
  assertEquals(descriptor.name, "<anonymous>");
});

Deno.test("edge: a method definition's name comes from its key", () => {
  const node: FunctionLike = {
    id: null,
    params: [],
    parent: {
      type: "MethodDefinition",
      key: { type: "Identifier", name: "render" },
    },
    body: blockBody([0, 2]),
  };
  const descriptor = describeFunction(node, reader("{}"));
  assertEquals(descriptor.name, "render");
});

Deno.test("edge: a null body (ambient declaration) reports zero body lines, no throw", () => {
  const node: FunctionLike = {
    id: { type: "Identifier", name: "declared" },
    params: [],
    parent: { type: "Program" },
    body: null,
  };
  const descriptor = describeFunction(node, reader(""));
  assertEquals(descriptor.bodyLineCount, 0);
});

Deno.test("edge: an expression-bodied arrow's body length excludes no braces", () => {
  const src = "a + 1";
  const node: FunctionLike = {
    id: null,
    params: [],
    parent: {
      type: "VariableDeclarator",
      id: { type: "Identifier", name: "sum" },
    },
    body: { type: "BinaryExpression", range: [0, src.length] },
  };
  const descriptor = describeFunction(node, reader(src));
  assertEquals(descriptor.bodyLineCount, 1);
});

Deno.test("edge: body line count excludes the opening and closing brace lines", () => {
  const src = "{\n  a;\n  b;\n  c;\n}";
  const node: FunctionLike = {
    id: { type: "Identifier", name: "f" },
    params: [],
    parent: { type: "Program" },
    body: blockBody([0, src.length]),
  };
  const descriptor = describeFunction(node, reader(src));
  assertEquals(descriptor.bodyLineCount, 3);
});

Deno.test("mutation-guard: two functions with different names but identical bodies share a fingerprint", () => {
  const body = blockBody([0, 2]);
  const fooDescriptor = describeWithName("foo", body);
  const barDescriptor = describeWithName("bar", body);
  assertEquals(fooDescriptor.bodyFingerprint, barDescriptor.bodyFingerprint);
  assertEquals(fooDescriptor.name, "foo");
  assertEquals(barDescriptor.name, "bar");
});
