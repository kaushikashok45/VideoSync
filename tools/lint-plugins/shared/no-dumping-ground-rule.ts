import { createBoundaryRuleKit } from "./boundary-rule-kit.ts";
import type { Suppressor } from "../../contracts/suppress";

type Kit = ReturnType<typeof createBoundaryRuleKit>;

const RULE_ID = "boundary/no-dumping-ground";
const BANNED_FILENAME = /^(utils?|helpers?|misc|common|shared|types)\.tsx?$/;
const BANNED_DIR = /^(utils?|helpers?|common)$/;

function isBannedFilename(filename: string): boolean {
  return BANNED_FILENAME.test(filename);
}

function isBannedDir(dirs: readonly string[]): boolean {
  return dirs.some((dir) => BANNED_DIR.test(dir));
}

function isNestedIndex(filename: string, dirs: readonly string[]): boolean {
  return /^index\.tsx?$/.test(filename) && dirs.length > 0;
}

function isMisplacedConstants(
  filename: string,
  dirs: readonly string[],
): boolean {
  return /^constants\.tsx?$/.test(filename) && dirs[0] !== "contracts";
}

const CHECKS: ReadonlyArray<
  {
    test: (filename: string, dirs: readonly string[]) => boolean;
    message: string;
  }
> = [
  {
    test: (filename) => isBannedFilename(filename),
    message: "This filename is a banned dumping ground; use lib/ instead.",
  },
  {
    test: (_filename, dirs) => isBannedDir(dirs),
    message: "This directory is a banned dumping ground; use lib/ instead.",
  },
  {
    test: isNestedIndex,
    message: "index.ts is legal only at a slice root, not a nested barrel.",
  },
  {
    test: isMisplacedConstants,
    message: "constants.ts is legal only under contracts/.",
  },
];

function violationMessage(sliceRoot: string, filePath: string): string | null {
  const relative = filePath.slice(sliceRoot.length + 1).split("/");
  const filename = relative[relative.length - 1];
  const dirs = relative.slice(0, -1);
  return CHECKS.find((check) => check.test(filename, dirs))?.message ?? null;
}

/**
 * "No helpers" with teeth: filename/directory dumping grounds inside a
 * slice, plus the two positional exceptions (`index.ts` only at a slice
 * root, `constants.ts` only under `contracts/`).
 */
export function createNoDumpingGroundRule(
  kit: Kit,
  suppressor: Suppressor,
): Deno.lint.Rule {
  return {
    create(context) {
      return kit.forKnownFiles(context, (fsd) => ({
        Program(node) {
          if (fsd.sliceRoot === null) return;
          const message = violationMessage(fsd.sliceRoot, context.filename);
          if (message === null) return;
          kit.reportAtNode({
            context,
            suppressor,
            ruleId: RULE_ID,
            node,
            message,
          });
        },
      }));
    },
  };
}
