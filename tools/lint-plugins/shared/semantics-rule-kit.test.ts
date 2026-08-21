import { assert, assertEquals } from "@std/assert";
import { createSemanticsRuleKit } from "./semantics-rule-kit.ts";
import type { Suppressor } from "../../contracts/suppress";

const REPO_ROOT = "/repo";

function notImplemented(name: string): never {
  throw new Error(`fakeContext: ${name} is not used by this test double`);
}

function fakeSourceCode(text: string): Deno.lint.SourceCode {
  return {
    text,
    ast: {
      type: "Program",
      range: [0, text.length],
      sourceType: "module",
      body: [],
      comments: [],
    },
    getText: (node) => node ? text.slice(node.range[0], node.range[1]) : text,
    getAncestors: () => notImplemented("getAncestors"),
    getAllComments: () => [],
    getCommentsBefore: () => [],
    getCommentsAfter: () => [],
    getCommentsInside: () => [],
  };
}

function fakeContext(
  filename: string,
  sourceText: string,
): { context: Deno.lint.RuleContext; reports: string[] } {
  const reports: string[] = [];
  const context: Deno.lint.RuleContext = {
    id: "probe/fake",
    filename,
    sourceCode: fakeSourceCode(sourceText),
    report: (payload: { message: string }) => reports.push(payload.message),
    getFilename: () => filename,
    getSourceCode: () => fakeSourceCode(sourceText),
  };
  return { context, reports };
}

function suppressor(isKnown: boolean): Suppressor {
  return { loaded: isKnown, isKnown: () => isKnown };
}

// --- forKnownFiles ----------------------------------------------------------

Deno.test("happy: forKnownFiles builds the visitor for a file inside a known root", () => {
  const kit = createSemanticsRuleKit(REPO_ROOT);
  const { context } = fakeContext(
    `${REPO_ROOT}/app/features/f1/model/x.ts`,
    "",
  );
  let built = false;
  const visitor = kit.forKnownFiles(context, () => {
    built = true;
    return {};
  });
  assert(built);
  assertEquals(visitor, {});
});

Deno.test("edge: forKnownFiles skips a path outside every known root without calling build", () => {
  const kit = createSemanticsRuleKit(REPO_ROOT);
  const { context } = fakeContext(`${REPO_ROOT}/misc/scratch.ts`, "");
  let built = false;
  const visitor = kit.forKnownFiles(context, () => {
    built = true;
    return { Program() {} };
  });
  assert(!built);
  assertEquals(visitor, {});
});

Deno.test("edge: forKnownFiles does NOT exempt tools/** unlike the boundary rule kit", () => {
  const kit = createSemanticsRuleKit(REPO_ROOT);
  const { context } = fakeContext(`${REPO_ROOT}/tools/lint-plugins/x.ts`, "");
  let built = false;
  kit.forKnownFiles(context, () => {
    built = true;
    return {};
  });
  assert(built);
});

// --- reportAtNode -------------------------------------------------------------

Deno.test("happy: reportAtNode reports when the identity is not suppressed", () => {
  const kit = createSemanticsRuleKit(REPO_ROOT);
  const { context, reports } = fakeContext(
    `${REPO_ROOT}/app/features/f1/model/x.ts`,
    "const a = 1;",
  );
  kit.reportAtNode({
    context,
    suppressor: suppressor(false),
    ruleId: "semantics/test",
    node: { range: [0, 5] },
    message: "boom",
  });
  assertEquals(reports, ["boom"]);
});

Deno.test("sad: reportAtNode is silent when the suppressor already knows the identity", () => {
  const kit = createSemanticsRuleKit(REPO_ROOT);
  const { context, reports } = fakeContext(
    `${REPO_ROOT}/app/features/f1/model/x.ts`,
    "const a = 1;",
  );
  kit.reportAtNode({
    context,
    suppressor: suppressor(true),
    ruleId: "semantics/test",
    node: { range: [0, 5] },
    message: "boom",
  });
  assertEquals(reports.length, 0);
});

// --- reportAtProgram ------------------------------------------------------------

Deno.test("happy: reportAtProgram reports when the identity is not suppressed", () => {
  const kit = createSemanticsRuleKit(REPO_ROOT);
  const source = "export const a = 1;\nexport const b = 2;\n";
  const { context, reports } = fakeContext(
    `${REPO_ROOT}/app/features/f1/model/x.ts`,
    source,
  );
  kit.reportAtProgram({
    context,
    suppressor: suppressor(false),
    ruleId: "semantics/test",
    node: {
      range: [0, source.length],
      body: [{ range: [0, 19] }, { range: [20, 39] }],
    },
    message: "boom",
  });
  assertEquals(reports, ["boom"]);
});

Deno.test("sad: reportAtProgram is silent when the suppressor already knows the identity", () => {
  const kit = createSemanticsRuleKit(REPO_ROOT);
  const source = "export const a = 1;\n";
  const { context, reports } = fakeContext(
    `${REPO_ROOT}/app/features/f1/model/x.ts`,
    source,
  );
  kit.reportAtProgram({
    context,
    suppressor: suppressor(true),
    ruleId: "semantics/test",
    node: { range: [0, source.length], body: [{ range: [0, source.length] }] },
    message: "boom",
  });
  assertEquals(reports.length, 0);
});
