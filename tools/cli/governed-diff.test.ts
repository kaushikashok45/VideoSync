import {
  assert,
  assertEquals,
  assertNotEquals,
  assertThrows,
} from "@std/assert";
import { governedDiff } from "./governed-diff.ts";

function sh(cwd: string, args: string[]): { code: number; stdout: string } {
  const out = new Deno.Command("git", { args, cwd }).outputSync();
  return { code: out.code, stdout: new TextDecoder().decode(out.stdout) };
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

Deno.test("happy: staged change produces a stable receiptKey across two invocations", async () => {
  const dir = await gitRepo();
  await Deno.writeTextFile(`${dir}/file.txt`, "hello\n");
  sh(dir, ["add", "file.txt"]);
  await inRepo(dir, () => {
    const first = governedDiff();
    const second = governedDiff();
    assertEquals(first.receiptKey, second.receiptKey);
    assertEquals(first.changedFiles, ["file.txt"]);
  });
  await Deno.remove(dir, { recursive: true });
});

Deno.test("sad: not a git repo produces a harness error, not a silent empty diff", async () => {
  const dir = await Deno.makeTempDir();
  await inRepo(dir, () => {
    assertThrows(() => governedDiff());
  });
  await Deno.remove(dir, { recursive: true });
});

Deno.test("edge: a staged rename does not crash and both names surface", async () => {
  const dir = await gitRepo();
  await Deno.writeTextFile(`${dir}/old-name.txt`, "content\n");
  sh(dir, ["add", "old-name.txt"]);
  sh(dir, ["commit", "-q", "-m", "seed"]);
  sh(dir, ["mv", "old-name.txt", "new-name.txt"]);
  await inRepo(dir, () => {
    const result = governedDiff();
    assert(result.changedFiles.includes("new-name.txt"));
  });
  await Deno.remove(dir, { recursive: true });
});

Deno.test("edge: a staged file under .claude/review-receipts/ is excluded and does not perturb receiptKey", async () => {
  const dir = await gitRepo();
  await Deno.writeTextFile(`${dir}/file.txt`, "hello\n");
  sh(dir, ["add", "file.txt"]);
  const baseline = await inRepo(dir, () => governedDiff());

  await Deno.mkdir(`${dir}/.claude/review-receipts`, { recursive: true });
  await Deno.writeTextFile(
    `${dir}/.claude/review-receipts/receipt.json`,
    "{}\n",
  );
  sh(dir, ["add", ".claude/review-receipts/receipt.json"]);
  const withReceipt = await inRepo(dir, () => governedDiff());

  assertEquals(withReceipt.receiptKey, baseline.receiptKey);
  assert(
    !withReceipt.changedFiles.some((changedFile) =>
      changedFile.includes("review-receipts")
    ),
  );
  await Deno.remove(dir, { recursive: true });
});

async function stageReceiptFile(
  dir: string,
  adapterDir: string,
): Promise<void> {
  const relativePath = `${adapterDir}/review-receipts/receipt.json`;
  await Deno.mkdir(`${dir}/${adapterDir}/review-receipts`, {
    recursive: true,
  });
  await Deno.writeTextFile(`${dir}/${relativePath}`, "{}\n");
  sh(dir, ["add", relativePath]);
}

/** Stages a receipt file under `adapterDir/review-receipts/` and asserts it
 * perturbs neither `receiptKey` nor `changedFiles` -- shared by every
 * adapter directory (AD-015: none of the three is canonical). */
async function assertReceiptDirExcluded(adapterDir: string): Promise<void> {
  const dir = await gitRepo();
  await Deno.writeTextFile(`${dir}/file.txt`, "hello\n");
  sh(dir, ["add", "file.txt"]);
  const baseline = await inRepo(dir, () => governedDiff());

  await stageReceiptFile(dir, adapterDir);
  const withReceipt = await inRepo(dir, () => governedDiff());

  assertEquals(withReceipt.receiptKey, baseline.receiptKey);
  assert(
    !withReceipt.changedFiles.some((changedFile) =>
      changedFile.includes("review-receipts")
    ),
  );
  await Deno.remove(dir, { recursive: true });
}

for (const adapterDir of [".agents", ".opencode"]) {
  Deno.test(
    `edge: a staged file under ${adapterDir}/review-receipts/ is excluded and does not perturb receiptKey`,
    () => assertReceiptDirExcluded(adapterDir),
  );
}

Deno.test("edge: an empty stage produces an empty changed-file list", async () => {
  const dir = await gitRepo();
  await inRepo(dir, () => {
    const result = governedDiff();
    assertEquals(result.changedFiles, []);
    assertEquals(result.patch, "");
  });
  await Deno.remove(dir, { recursive: true });
});

Deno.test("edge: a filename containing a space is handled correctly", async () => {
  const dir = await gitRepo();
  await Deno.writeTextFile(`${dir}/has space.txt`, "hello\n");
  sh(dir, ["add", "has space.txt"]);
  await inRepo(dir, () => {
    const result = governedDiff();
    assert(result.changedFiles.includes("has space.txt"));
  });
  await Deno.remove(dir, { recursive: true });
});

const D1_BASE = ["diff", "--cached"];
const D1_TAIL = ["--", ".", ":(exclude).claude/review-receipts/**"];

Deno.test("mutation: dropping --no-color changes the receiptKey", async () => {
  const dir = await gitRepo();
  sh(dir, ["config", "color.diff", "always"]);
  await Deno.writeTextFile(`${dir}/file.txt`, "hello\n");
  sh(dir, ["add", "file.txt"]);
  const real = await inRepo(dir, () => governedDiff());
  const without = sh(dir, [
    "-c",
    "core.abbrev=40",
    ...D1_BASE,
    "--no-ext-diff",
    "-U3",
    ...D1_TAIL,
  ]);
  const withoutKey = await sha256Hex(without.stdout);
  assertNotEquals(real.receiptKey, withoutKey);
  await Deno.remove(dir, { recursive: true });
});

/** Runs the raw (non-governed) git diff with the given flags/tail and asserts its hash differs from `real`'s receiptKey -- the shared shape of every "dropping a default flag changes the key" mutation test below. */
async function assertReceiptKeyDiffersFromRawDiff(
  dir: string,
  real: { receiptKey: string },
  flags: readonly string[],
  tail: readonly string[] = D1_TAIL,
): Promise<void> {
  const without = sh(dir, [
    "-c",
    "core.abbrev=40",
    ...D1_BASE,
    ...flags,
    ...tail,
  ]);
  const withoutKey = await sha256Hex(without.stdout);
  assertNotEquals(real.receiptKey, withoutKey);
  await Deno.remove(dir, { recursive: true });
}

Deno.test("mutation: dropping --no-ext-diff changes the receiptKey", async () => {
  const dir = await gitRepo();
  await Deno.writeTextFile(
    `${dir}/difftool.sh`,
    "#!/bin/sh\necho EXTERNAL-DIFF-MARKER\n",
  );
  await Deno.chmod(`${dir}/difftool.sh`, 0o755);
  sh(dir, ["config", "diff.external", `${dir}/difftool.sh`]);
  await Deno.writeTextFile(`${dir}/file.txt`, "hello\n");
  sh(dir, ["add", "file.txt"]);
  const real = await inRepo(dir, () => governedDiff());
  await assertReceiptKeyDiffersFromRawDiff(dir, real, ["--no-color", "-U3"]);
});

Deno.test("mutation: dropping -U3 (using -U1) changes the receiptKey", async () => {
  const dir = await gitRepo();
  const lines = Array.from(
    { length: 20 },
    (_element, lineIndex) => `line${lineIndex}`,
  );
  await Deno.writeTextFile(`${dir}/file.txt`, lines.join("\n") + "\n");
  sh(dir, ["add", "file.txt"]);
  sh(dir, ["commit", "-q", "-m", "seed"]);
  lines[10] = "CHANGED";
  await Deno.writeTextFile(`${dir}/file.txt`, lines.join("\n") + "\n");
  sh(dir, ["add", "file.txt"]);
  const real = await inRepo(dir, () => governedDiff());
  await assertReceiptKeyDiffersFromRawDiff(dir, real, [
    "--no-color",
    "--no-ext-diff",
    "-U1",
  ]);
});

Deno.test("mutation: dropping the receipt exclusion changes the receiptKey", async () => {
  const dir = await gitRepo();
  await Deno.writeTextFile(`${dir}/file.txt`, "hello\n");
  sh(dir, ["add", "file.txt"]);
  await Deno.mkdir(`${dir}/.claude/review-receipts`, { recursive: true });
  await Deno.writeTextFile(
    `${dir}/.claude/review-receipts/receipt.json`,
    "{}\n",
  );
  sh(dir, ["add", ".claude/review-receipts/receipt.json"]);
  const real = await inRepo(dir, () => governedDiff());
  await assertReceiptKeyDiffersFromRawDiff(
    dir,
    real,
    ["--no-color", "--no-ext-diff", "-U3"],
    ["--", "."],
  );
});

Deno.test("logical-limits: changedFiles is exactly --name-only on the identical command", async () => {
  const dir = await gitRepo();
  await Deno.writeTextFile(`${dir}/a.txt`, "a\n");
  await Deno.writeTextFile(`${dir}/b.txt`, "b\n");
  sh(dir, ["add", "a.txt", "b.txt"]);
  const result = await inRepo(dir, () => governedDiff());
  const nameOnly = sh(dir, [
    "-c",
    "core.abbrev=40",
    ...D1_BASE,
    "--no-color",
    "--no-ext-diff",
    "-U3",
    "--name-only",
    ...D1_TAIL,
  ]);
  const expected = nameOnly.stdout.split("\n").filter((line) =>
    line.length > 0
  );
  assertEquals(result.changedFiles, expected);
  await Deno.remove(dir, { recursive: true });
});

async function sha256Hex(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
}
