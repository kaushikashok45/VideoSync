import { assertEquals, assertThrows } from "@std/assert";
import { withMutationWorktree } from "./worktree.ts";

const REPO_ROOT = new URL("../../", import.meta.url).pathname.replace(
  /\/$/,
  "",
);

function worktreeCount(): number {
  const list = new Deno.Command("git", {
    args: ["-C", REPO_ROOT, "worktree", "list", "--porcelain"],
    stdout: "piped",
  }).outputSync();
  return new TextDecoder().decode(list.stdout).split("\n\n")
    .filter((block) => block.trim().length > 0).length;
}

Deno.test("happy: a normal run creates exactly one worktree and removes it", () => {
  const before = worktreeCount();
  let sawWorktree = false;
  withMutationWorktree(REPO_ROOT, (worktreeDir) => {
    sawWorktree = worktreeCount() === before + 1 &&
      Deno.statSync(worktreeDir).isDirectory;
  });
  assertEquals(sawWorktree, true);
  assertEquals(worktreeCount(), before);
});

Deno.test("sad: a run that throws still removes the worktree", () => {
  const before = worktreeCount();
  assertThrows(() => {
    withMutationWorktree(REPO_ROOT, () => {
      throw new Error("boom");
    });
  });
  assertEquals(worktreeCount(), before);
});
