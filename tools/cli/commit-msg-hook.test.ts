import { assert, assertEquals } from "@std/assert";
import { runCommitMsgHook } from "./commit-msg-hook.ts";
import { gitWriteTree } from "./git-tree-hash.ts";
import { ignoreExpectedFailure } from "../lint-plugins/shared/ignore-expected-failure.ts";

async function pathExists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch (error) {
    ignoreExpectedFailure(error);
    return false;
  }
}

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

async function stagedRepo(): Promise<string> {
  const dir = await gitRepo();
  await Deno.writeTextFile(`${dir}/f.txt`, "hello\n");
  sh(dir, ["add", "f.txt"]);
  return dir;
}

async function msgFile(dir: string, text: string): Promise<string> {
  const path = `${dir}/COMMIT_EDITMSG`;
  await Deno.writeTextFile(path, text);
  return path;
}

Deno.test("happy: a matching marker (normal path -- pre-commit just ran) adds no trailer", async () => {
  const dir = await stagedRepo();
  const gitDir = `${dir}/.git`;
  await Deno.writeTextFile(`${gitDir}/.governance-last-run`, gitWriteTree(dir));
  const path = await msgFile(dir, "feat: add thing\n");

  const code = runCommitMsgHook(dir, gitDir, path);

  assertEquals(code, 0);
  assertEquals(await Deno.readTextFile(path), "feat: add thing\n");
  await Deno.remove(dir, { recursive: true });
});

Deno.test("sad: no marker at all (simulated --no-verify: pre-commit was skipped) appends the trailer", async () => {
  const dir = await stagedRepo();
  const gitDir = `${dir}/.git`;
  const path = await msgFile(dir, "feat: sneaky\n");

  const code = runCommitMsgHook(dir, gitDir, path);

  assertEquals(code, 0);
  const text = await Deno.readTextFile(path);
  assert(text.includes("Governance-Bypass: true (pre-commit skipped)"));
  await Deno.remove(dir, { recursive: true });
});

Deno.test("edge: a stale marker from an earlier tree appends the trailer", async () => {
  const dir = await stagedRepo();
  const gitDir = `${dir}/.git`;
  await Deno.writeTextFile(`${gitDir}/.governance-last-run`, "0".repeat(40));
  const path = await msgFile(dir, "feat: drifted\n");

  const code = runCommitMsgHook(dir, gitDir, path);

  assertEquals(code, 0);
  assert(
    (await Deno.readTextFile(path)).includes("Governance-Bypass"),
  );
  await Deno.remove(dir, { recursive: true });
});

Deno.test("edge: the marker is single-use -- a second run without a fresh marker also trips", async () => {
  const dir = await stagedRepo();
  const gitDir = `${dir}/.git`;
  await Deno.writeTextFile(`${gitDir}/.governance-last-run`, gitWriteTree(dir));
  const firstMsg = await msgFile(dir, "feat: first\n");
  const firstCode = runCommitMsgHook(dir, gitDir, firstMsg);
  assertEquals(firstCode, 0);
  assertEquals(await Deno.readTextFile(firstMsg), "feat: first\n");

  // Same tree, second commit, no fresh pre-commit run this time.
  const secondMsg = await msgFile(dir, "feat: second\n");
  const secondCode = runCommitMsgHook(dir, gitDir, secondMsg);
  assertEquals(secondCode, 0);
  assert(
    (await Deno.readTextFile(secondMsg)).includes("Governance-Bypass"),
    "a stale marker from the previous commit must not silently match",
  );
  await Deno.remove(dir, { recursive: true });
});

Deno.test("logical-limits: the marker file is removed after being read, match or not", async () => {
  const dir = await stagedRepo();
  const gitDir = `${dir}/.git`;
  const markerPath = `${gitDir}/.governance-last-run`;
  await Deno.writeTextFile(markerPath, gitWriteTree(dir));
  const path = await msgFile(dir, "feat: x\n");

  runCommitMsgHook(dir, gitDir, path);

  assertEquals(await pathExists(markerPath), false);
  await Deno.remove(dir, { recursive: true });
});
