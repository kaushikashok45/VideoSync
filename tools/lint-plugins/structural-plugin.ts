import { loadSuppressor } from "./shared/suppress.ts";
import { describeFunction } from "./shared/function-node.ts";
import { complexityLimit } from "./shared/complexity-limit.ts";
import { createFrameStack } from "./shared/function-frame-stack.ts";
import { createStructuralRuleKit } from "./shared/structural-rule-kit.ts";
import { createFileLengthRule } from "./shared/file-length-rule.ts";
import { frameScopedVisitors } from "./shared/frame-scoped-visitors.ts";
import type { Suppressor } from "../contracts/suppress";
import type { FunctionNode } from "../contracts/frame-scoped-visitors";
import type { FsdPath } from "../contracts/fsd-path";

const BODY_LINE_LIMIT = 20;
const NESTING_DEPTH_LIMIT = 2;
const PARAM_COUNT_LIMIT = 4;

type Kit = ReturnType<typeof createStructuralRuleKit>;

function complexityVisitor(
  kit: Kit,
  suppressor: Suppressor,
  context: Deno.lint.RuleContext,
  fsd: FsdPath,
): Deno.lint.LintVisitor {
  const limit = complexityLimit(fsd);
  const stack = createFrameStack<FunctionNode>();
  return frameScopedVisitors(stack, (node) => {
    const frame = stack.pop();
    if (frame.complexity <= limit) return;
    const message =
      `Cyclomatic complexity ${frame.complexity} exceeds the limit of ${limit}.`;
    kit.report({
      context,
      suppressor,
      ruleId: "structural/complexity",
      node,
      message,
    });
  });
}

function complexityRule(kit: Kit, suppressor: Suppressor): Deno.lint.Rule {
  return {
    create(context) {
      return kit.forKnownFiles(
        context,
        (fsd) => complexityVisitor(kit, suppressor, context, fsd),
      );
    },
  };
}

function nestingDepthRule(kit: Kit, suppressor: Suppressor): Deno.lint.Rule {
  return {
    create(context) {
      return kit.forKnownFiles(context, () => {
        const stack = createFrameStack<FunctionNode>();
        return frameScopedVisitors(stack, (node) => {
          const frame = stack.pop();
          if (frame.maxNestingDepth <= NESTING_DEPTH_LIMIT) return;
          const message =
            `Nesting depth ${frame.maxNestingDepth} exceeds the limit of ${NESTING_DEPTH_LIMIT} past the function body.`;
          kit.report({
            context,
            suppressor,
            ruleId: "structural/nesting-depth",
            node,
            message,
          });
        });
      });
    },
  };
}

function functionRule(
  kit: Kit,
  check: (context: Deno.lint.RuleContext, node: FunctionNode) => void,
): Deno.lint.Rule {
  return {
    create(context) {
      return kit.forKnownFiles(context, () => {
        const visit = (node: FunctionNode) => check(context, node);
        return {
          FunctionDeclaration: visit,
          FunctionExpression: visit,
          ArrowFunctionExpression: visit,
        };
      });
    },
  };
}

function bodyLengthRule(kit: Kit, suppressor: Suppressor): Deno.lint.Rule {
  return functionRule(kit, (context, node) => {
    const descriptor = describeFunction(node, context.sourceCode);
    if (descriptor.bodyLineCount <= BODY_LINE_LIMIT) return;
    const message =
      `Function body of ${descriptor.bodyLineCount} lines exceeds the limit of ${BODY_LINE_LIMIT}.`;
    kit.report({
      context,
      suppressor,
      ruleId: "structural/body-length",
      node,
      message,
    });
  });
}

function paramCountRule(kit: Kit, suppressor: Suppressor): Deno.lint.Rule {
  return functionRule(kit, (context, node) => {
    if (node.params.length <= PARAM_COUNT_LIMIT) return;
    const message =
      `${node.params.length} parameters exceeds the limit of ${PARAM_COUNT_LIMIT}.`;
    kit.report({
      context,
      suppressor,
      ruleId: "structural/param-count",
      node,
      message,
    });
  });
}

/**
 * Size and structure limits from `docs/CODING_STANDARDS.md` §1, built fresh
 * per call rather than as a module-level singleton so tests can point it at
 * an isolated `repoRoot`/baseline instead of the real repository. The plugin
 * itself is left unregistered in `deno.json` until commit 7
 * [why](docs/DECISIONS.md#ad-010); until then it is exercised only via
 * `Deno.lint.runPlugin`, which is why a fresh call per test is cheap and
 * correct rather than a performance concern.
 */
export function createStructuralPlugin(repoRoot: string): Deno.lint.Plugin {
  // Built once per construction, not per rule and not per file
  // [why](FLOW.md Step 3) -- a whole-tree run must read the baseline once.
  const suppressor = loadSuppressor(`${repoRoot}/tools/baseline/baseline.json`);
  const kit = createStructuralRuleKit(repoRoot);
  return {
    name: "structural",
    rules: {
      "complexity": complexityRule(kit, suppressor),
      "nesting-depth": nestingDepthRule(kit, suppressor),
      "body-length": bodyLengthRule(kit, suppressor),
      "param-count": paramCountRule(kit, suppressor),
      "file-length": createFileLengthRule(suppressor, repoRoot),
    },
  };
}
