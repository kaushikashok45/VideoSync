import { assertEquals, assertMatch, assertThrows } from "@std/assert";
import { gitWriteTree } from "./git-tree-hash.ts";

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

Deno.test("happy: a staged file produces a 40-character sha1 tree id", async () => {
  const dir = await gitRepo();
  await Deno.writeTextFile(`${dir}/f.txt`, "hi\n");
  sh(dir, ["add", "f.txt"]);
  assertMatch(gitWriteTree(dir), /^[0-9a-f]{40}$/);
  await Deno.remove(dir, { recursive: true });
});

Deno.test("happy: the same staged content produces the same tree id twice", async () => {
  const dir = await gitRepo();
  await Deno.writeTextFile(`${dir}/f.txt`, "same\n");
  sh(dir, ["add", "f.txt"]);
  assertEquals(gitWriteTree(dir), gitWriteTree(dir));
  await Deno.remove(dir, { recursive: true });
});

Deno.test("edge: staging one more line changes the tree id", async () => {
  const dir = await gitRepo();
  await Deno.writeTextFile(`${dir}/f.txt`, "line1\n");
  sh(dir, ["add", "f.txt"]);
  const before = gitWriteTree(dir);
  await Deno.writeTextFile(`${dir}/f.txt`, "line1\nline2\n");
  sh(dir, ["add", "f.txt"]);
  const after = gitWriteTree(dir);
  if (before === after) throw new Error("tree id did not change");
  await Deno.remove(dir, { recursive: true });
});

Deno.test("sad: not a git repo throws rather than returning a sentinel", async () => {
  const dir = await Deno.makeTempDir();
  assertThrows(() => gitWriteTree(dir));
  await Deno.remove(dir, { recursive: true });
});
