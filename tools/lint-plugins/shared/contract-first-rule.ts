import { classify } from "./fsd-path.ts";
import { createBoundaryRuleKit } from "./boundary-rule-kit.ts";
import type { Suppressor } from "../../contracts/suppress";
import type { SliceProbe } from "../../contracts/fs-probes";

type Kit = ReturnType<typeof createBoundaryRuleKit>;

interface Probes {
  probe(sliceRoot: string): SliceProbe;
  claimReport(sliceRoot: string, ruleId: string): boolean;
}

interface ContractFirstOptions {
  readonly repoRoot: string;
  readonly addedFiles: ReadonlySet<string>;
}

const RULE_ID = "boundary/contract-first";

const SHAPE_CHECKS: ReadonlyArray<
  { test: (added: readonly string[]) => boolean; message: string }
> = [
  {
    test: (added) => !added.includes("contracts"),
    message: "A new slice's first commit must include its contract file.",
  },
  {
    test: (added) => !added.includes("index"),
    message: "A new slice's first commit must include index.ts.",
  },
  {
    test: (added) => added.includes("ui") || added.includes("lib"),
    message: "A new slice's first commit must contain only its contract " +
      "and index.ts, no ui/ or lib/ files.",
  },
];

function repoRelative(absolutePath: string, repoRoot: string): string {
  return absolutePath.startsWith(repoRoot)
    ? absolutePath.slice(repoRoot.length).replace(/^\/+/, "")
    : absolutePath;
}

function* walk(dir: string): Generator<string> {
  for (const entry of Deno.readDirSync(dir)) {
    const full = `${dir}/${entry.name}`;
    if (entry.isDirectory) {
      yield* walk(full);
      continue;
    }
    if (entry.isFile) yield full;
  }
}

function isNewSlice(
  sliceRoot: string,
  repoRoot: string,
  addedFiles: ReadonlySet<string>,
): boolean {
  for (const file of walk(sliceRoot)) {
    if (!addedFiles.has(repoRelative(file, repoRoot))) return false;
  }
  return true;
}

function addedRolesFor(
  sliceRoot: string,
  repoRoot: string,
  addedFiles: ReadonlySet<string>,
): readonly string[] {
  const prefix = `${repoRelative(sliceRoot, repoRoot)}/`;
  return [...addedFiles]
    .filter((file) => file.startsWith(prefix))
    .map((file) => classify(`${repoRoot}/${file}`).role);
}

function contractFirstMessage(
  sliceRoot: string,
  options: ContractFirstOptions,
): string | null {
  if (!isNewSlice(sliceRoot, options.repoRoot, options.addedFiles)) {
    return null;
  }
  const added = addedRolesFor(sliceRoot, options.repoRoot, options.addedFiles);
  return SHAPE_CHECKS.find((check) => check.test(added))?.message ?? null;
}

/**
 * A pure diff-shape check (no git-history archaeology): a slice is "new"
 * when every file currently on disk under it is also in the governed
 * diff's `addedFiles`. For such a slice, the diff must add the contract
 * file and `index.ts`, and nothing under `ui/`/`lib/` yet.
 */
export function createContractFirstRule(
  kit: Kit,
  probes: Probes,
  suppressor: Suppressor,
  options: ContractFirstOptions,
): Deno.lint.Rule {
  return {
    create(context) {
      return kit.forKnownFiles(context, (fsd) => ({
        Program(node) {
          if (fsd.sliceRoot === null) return;
          if (!probes.claimReport(fsd.sliceRoot, RULE_ID)) return;
          const message = contractFirstMessage(fsd.sliceRoot, options);
          if (message === null) return;
          kit.reportForSlice({
            context,
            suppressor,
            ruleId: RULE_ID,
            sliceRoot: fsd.sliceRoot,
            node,
            message,
          });
        },
      }));
    },
  };
}
