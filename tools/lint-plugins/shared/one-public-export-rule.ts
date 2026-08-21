import type { createSemanticsRuleKit } from "./semantics-rule-kit.ts";
import { countProgramExports } from "./export-count.ts";
import type { Suppressor } from "../../contracts/suppress";

type Kit = ReturnType<typeof createSemanticsRuleKit>;

const RULE_ID = "semantics/one-public-export";
const MESSAGE = "Module has more than one public export. Keep at most one " +
  "per module; share types via contracts/<name>.d.ts instead.";

const EXEMPT_PATTERNS: readonly RegExp[] = [
  /(^|\/)index\.ts$/,
  /\/contracts\//,
  /\.d\.ts$/,
  /\.test\.tsx?$/,
];

/**
 * `index.ts`, anything under a `contracts/` directory, `*.d.ts`, and
 * `*.test.ts(x)` are exempt by design -- they are the module's own public
 * surface or its tests, not a second competing export.
 */
function isExemptModule(absolutePath: string): boolean {
  return EXEMPT_PATTERNS.some((pattern) => pattern.test(absolutePath));
}

/** D-010's own rule: at most one exported symbol per module. */
export function createOnePublicExportRule(
  kit: Kit,
  suppressor: Suppressor,
): Deno.lint.Rule {
  return {
    create(context) {
      return kit.forKnownFiles(context, () => ({
        Program(node) {
          if (isExemptModule(context.filename)) return;
          if (countProgramExports(node.body) <= 1) return;
          kit.reportAtProgram({
            context,
            suppressor,
            ruleId: RULE_ID,
            node,
            message: MESSAGE,
          });
        },
      }));
    },
  };
}
