import { assert, assertEquals } from "@std/assert";
import { runPreCommitHook } from "./pre-commit-hook.ts";
import { governedDiff } from "./governed-diff.ts";
import { hasClearReceipt } from "./receipt-lookup.ts";
import type { PreCommitDeps, StepOutcome } from "../contracts/precommit";

const RECEIPT_DIRS = [
  ".claude/review-receipts",
  ".agents/review-receipts",
  ".opencode/review-receipts",
];
const OK: StepOutcome = { ok: true, output: "" };
const FAIL: StepOutcome = { ok: false, output: "step failed" };

function sh(cwd: string, args: string[]): void {
  new Deno.Command("git", { args, cwd }).outputSync();
}

async function gitRepo(): Promise<string> {
  const dir = await Deno.makeTempDir();
  sh(dir, ["init", "-q"]);
  sh(dir, ["config", "user.email", "a@b.com"]);
  sh(dir, ["config", "user.name", "a"]);
  return dir;
}

async function inRepo<T>(dir: string, run: () => T | Promise<T>): Promise<T> {
  const original = Deno.cwd();
  Deno.chdir(dir);
  try {
    return await run();
  } finally {
    Deno.chdir(original);
  }
}

function stubDeps(overrides: Partial<PreCommitDeps> = {}): PreCommitDeps {
  return {
    receiptKey: () => governedDiff().receiptKey,
    hasReceipt: hasClearReceipt,
    runPrecommitTask: () => OK,
    writeMarker: () => {},
    ...overrides,
  };
}

async function stageAndKey(dir: string, content: string): Promise<string> {
  await Deno.writeTextFile(`${dir}/f.txt`, content);
  sh(dir, ["add", "f.txt"]);
  return await inRepo(dir, () => governedDiff().receiptKey);
}

async function writeReceipt(
  dir: string,
  receiptDir: string,
  key: string,
): Promise<void> {
  await Deno.mkdir(`${dir}/${receiptDir}`, { recursive: true });
  await Deno.writeTextFile(
    `${dir}/${receiptDir}/${key}.json`,
    JSON.stringify({ key, verdict: "CLEAR" }),
  );
}

/** Runs the hook with a receipt present and asserts it re-verifies and records the marker. */
async function assertReceiptAccepted(dir: string): Promise<void> {
  let precommitCalled = false;
  let markerWritten = false;
  const deps = stubDeps({
    runPrecommitTask: (repoRoot) => {
      precommitCalled = true;
      assertEquals(repoRoot, dir);
      return OK;
    },
    writeMarker: () => {
      markerWritten = true;
    },
  });
  const code = await inRepo(
    dir,
    () => runPreCommitHook(dir, `${dir}/.git`, deps),
  );
  assertEquals(code, 0);
  assert(precommitCalled, "expected deno task precommit to be re-run");
  assert(markerWritten, "expected the governance marker to be written");
}

for (const receiptDir of RECEIPT_DIRS) {
  Deno.test(`happy: a CLEAR receipt in ${receiptDir} round-trips to an accepted commit`, async () => {
    const dir = await gitRepo();
    const key = await stageAndKey(dir, "hello\n");
    await writeReceipt(dir, receiptDir, key);
    await assertReceiptAccepted(dir);
    await Deno.remove(dir, { recursive: true });
  });
}

/** Runs the hook against a bare stub (no receipt) and captures its stderr, exit code, and latency. */
async function runBlocked(
  dir: string,
  deps: PreCommitDeps,
): Promise<{ code: number; lines: string[]; elapsedMs: number }> {
  const lines: string[] = [];
  const original = console.error;
  console.error = (msg: string) => lines.push(msg);
  const start = performance.now();
  const code = await inRepo(
    dir,
    () => runPreCommitHook(dir, `${dir}/.git`, deps),
  );
  const elapsedMs = performance.now() - start;
  console.error = original;
  return { code, lines, elapsedMs };
}

/** A `PreCommitDeps` whose `runPrecommitTask` records whether it was invoked. */
function trackedDeps(): { deps: PreCommitDeps; wasCalled: () => boolean } {
  let called = false;
  const deps = stubDeps({
    runPrecommitTask: () => {
      called = true;
      return OK;
    },
  });
  return { deps, wasCalled: () => called };
}

Deno.test("sad: no receipt anywhere blocks fast with the exact instruction message, and never runs precommit", async () => {
  const dir = await gitRepo();
  await stageAndKey(dir, "hello\n");
  const { deps, wasCalled } = trackedDeps();
  const { code, lines, elapsedMs } = await runBlocked(dir, deps);
  assertEquals(code, 1);
  assertEquals(
    lines[0],
    "Run: deno task precommit, then /review-now, then retry.",
  );
  assert(!wasCalled(), "deno task precommit must not run without a receipt");
  assert(elapsedMs < 2000, `expected a fast block, took ${elapsedMs}ms`);
  await Deno.remove(dir, { recursive: true });
});

Deno.test("edge: staleness -- a diff changed after the receipt was written blocks and skips precommit", async () => {
  const dir = await gitRepo();
  const staleKey = await stageAndKey(dir, "hello\n");
  await writeReceipt(dir, ".agents/review-receipts", staleKey);

  await stageAndKey(dir, "hello again\n");

  let precommitCalled = false;
  const deps = stubDeps({
    runPrecommitTask: () => {
      precommitCalled = true;
      return OK;
    },
  });
  const code = await inRepo(
    dir,
    () => runPreCommitHook(dir, `${dir}/.git`, deps),
  );
  assertEquals(code, 1);
  assert(!precommitCalled, "a stale receipt must not trigger a re-run");
  await Deno.remove(dir, { recursive: true });
});

Deno.test("sad: a receipt exists but the precommit re-run fails, blocking with no marker written", async () => {
  const dir = await gitRepo();
  const key = await stageAndKey(dir, "hello\n");
  await writeReceipt(dir, ".claude/review-receipts", key);

  let markerWritten = false;
  const deps = stubDeps({
    runPrecommitTask: () => FAIL,
    writeMarker: () => {
      markerWritten = true;
    },
  });
  const code = await inRepo(
    dir,
    () => runPreCommitHook(dir, `${dir}/.git`, deps),
  );
  assertEquals(code, 1);
  assert(!markerWritten, "the marker must not be written on a failed re-run");
  await Deno.remove(dir, { recursive: true });
});
