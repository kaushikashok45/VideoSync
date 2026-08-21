import { formatMutationReport } from "./mutation-report.ts";
import { runMutation } from "./run-mutation.ts";

const REPO_ROOT = new URL("../../", import.meta.url).pathname.replace(
  /\/$/,
  "",
);

function writeLine(message: string): void {
  Deno.stdout.writeSync(new TextEncoder().encode(`${message}\n`));
}

/**
 * `deno task mutate`'s real entry point. `Deno.lint.runPlugin` (used by every
 * operator module) only works under the `deno test` subcommand, so -- like
 * `tools/graph/collect-edges.harness.ts` and `tools/baseline/regen.harness.ts`
 * before it -- this is a `Deno.test` wrapper invoked via
 * `deno test -A --sloppy-imports tools/mutate/run-mutation.harness.ts -- <args>`,
 * not `deno run`.
 */
Deno.test({
  name: "mutate: run against the real repo",
  // Deno's test sanitizer treats any Deno.exit() call as a failure by
  // default (it exists to catch *accidental* early exits) -- this harness's
  // whole job is an intentional, meaningful exit code, so it opts out.
  sanitizeExit: false,
  fn: () => {
    const run = runMutation(Deno.args, REPO_ROOT);
    if (run.results.length === 0) {
      writeLine("mutate: no files to mutate");
    } else {
      writeLine(formatMutationReport(run.results));
    }
    Deno.exit(run.exitCode);
  },
});
