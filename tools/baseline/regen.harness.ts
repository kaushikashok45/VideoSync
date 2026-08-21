import { scopedSourceFiles } from "../cli/scoped-source-files.ts";
import { regenerateBaseline } from "./baseline.ts";
import { writeBaselineFile } from "./write-baseline.ts";
import { parseRegenOptions } from "./parse-regen-args.ts";
import { ignoreExpectedFailure } from "../lint-plugins/shared/ignore-expected-failure.ts";
import type {
  CountIncrease,
  LoadedFile,
  PersistedBaseline,
} from "../contracts/baseline-generate";

const REPO_ROOT = new URL("../../", import.meta.url).pathname.replace(
  /\/$/,
  "",
);
const OUTPUT_PATH = `${REPO_ROOT}/tools/baseline/baseline.json`;

function readPrevious(): PersistedBaseline | null {
  try {
    return JSON.parse(Deno.readTextFileSync(OUTPUT_PATH));
  } catch (error) {
    ignoreExpectedFailure(error);
    return null;
  }
}

async function loadFiles(
  paths: readonly string[],
): Promise<readonly LoadedFile[]> {
  const files: LoadedFile[] = [];
  for (const relativePath of paths) {
    const absolutePath = `${REPO_ROOT}/${relativePath}`;
    files.push({ absolutePath, source: await Deno.readTextFile(absolutePath) });
  }
  return files;
}

function describeIncrease(increase: CountIncrease): string {
  return `  ${increase.kind} ${increase.key}: ${increase.previous} -> ${increase.current}`;
}

function refusalMessage(increases: readonly CountIncrease[]): string {
  const lines = increases.map(describeIncrease);
  return [
    "baseline:regen refused -- these counts increased over the frozen baseline:",
    ...lines,
    'Pass --allow-increase --reason "..." to override.',
  ].join("\n");
}

/**
 * `baseline:regen`, runnable directly via
 * `deno test -A --sloppy-imports tools/baseline/regen.harness.ts`
 * (optionally `-- --allow-increase --reason "..."`). Not wired to a
 * `deno.json` task in this commit -- see the final report for why.
 */
Deno.test("baseline:regen -- seed or refresh the ratchet baseline", async () => {
  const paths = await scopedSourceFiles("all");
  const files = await loadFiles(paths);
  const result = regenerateBaseline({
    repoRoot: REPO_ROOT,
    files,
    paths,
    previous: readPrevious(),
    options: parseRegenOptions(Deno.args),
  });
  if (!result.ok) throw new Error(refusalMessage(result.increases));
  writeBaselineFile(OUTPUT_PATH, result.baseline);
});
