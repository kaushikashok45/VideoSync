import { classify } from "./fsd-path.ts";
import { reportViolation } from "./report-violation.ts";
import { fingerprintStatements } from "./body-fingerprint.ts";
import type { Suppressor } from "../../contracts/suppress";

const FILE_LINE_LIMIT = 150;

function lineCount(text: string): number {
  return text.length === 0 ? 0 : text.split("\n").length;
}

/**
 * The ≤150 cap exists to stop god-modules, where length proxies for
 * coupling. A test file is a flat list of mutually independent cases, so
 * that cost is absent -- and the project mandates five test categories per
 * capability, so capping test file length would penalise the thoroughness
 * every other rule demands. Only the whole-file line count is exempt here:
 * a single test's body still faces the ≤20-line cap and helpers inside a
 * test file still face the complexity cap, since neither is enforced by
 * this rule. Recorded in docs/CODING_STANDARDS.md §1. `classify().role` is
 * the sole test used here, per fsd-path.ts's existing role computation.
 */
function isFileLengthExempt(root: string, role: string): boolean {
  return root === "outside" || role === "test";
}

function checkFileLength(
  context: Deno.lint.RuleContext,
  node: Deno.lint.Program,
  suppressor: Suppressor,
  repoRoot: string,
): void {
  const lines = lineCount(context.sourceCode.text);
  if (lines <= FILE_LINE_LIMIT) return;
  reportViolation({
    context,
    suppressor,
    repoRoot,
    site: {
      ruleId: "structural/file-length",
      enclosingFunction: "",
      paramCount: -1,
      bodyFingerprint: fingerprintStatements(
        node.body,
        context.sourceCode.text,
      ),
      sliceKey: null,
    },
    range: node.range,
    message:
      `File length ${lines} lines exceeds the limit of ${FILE_LINE_LIMIT}.`,
  });
}

/** `docs/CODING_STANDARDS.md` §1's file-length limit, anchored at `Program` since it is not per-function. */
export function createFileLengthRule(
  suppressor: Suppressor,
  repoRoot: string,
): Deno.lint.Rule {
  return {
    create(context) {
      const fsd = classify(context.filename);
      if (isFileLengthExempt(fsd.root, fsd.role)) return {};
      return {
        Program: (node) => checkFileLength(context, node, suppressor, repoRoot),
      };
    },
  };
}
