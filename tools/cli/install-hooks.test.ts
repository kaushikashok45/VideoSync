import { assert, assertEquals } from "@std/assert";
import { installHooks } from "./install-hooks.ts";

// The hook wrappers `exec` a Deno entrypoint that must resolve against a
// checkout that actually has `tools/cli/*.ts` -- for these fixture-repo
// tests that is *this* checkout, not the disposable fixture, which has no
// copy of the toolchain. `gitDir` (the fixture's `.git`) and this project
// root are independent parameters by design (see LLD.md).
const PROJECT_ROOT = new URL("../../", import.meta.url).pathname.replace(
  /\/$/,
  "",
);

function sh(
  cwd: string,
  args: string[],
): { code: number; stdout: string; stderr: string } {
  const out = new Deno.Command("git", { args, cwd }).outputSync();
  return {
    code: out.code,
    stdout: new TextDecoder().decode(out.stdout),
    stderr: new TextDecoder().decode(out.stderr),
  };
}

async function gitRepo(): Promise<string> {
  const dir = await Deno.makeTempDir();
  sh(dir, ["init", "-q"]);
  sh(dir, ["config", "user.email", "a@b.com"]);
  sh(dir, ["config", "user.name", "a"]);
  return dir;
}

async function isExecutable(path: string): Promise<boolean> {
  const fileStat = await Deno.stat(path);
  return (fileStat.mode ?? 0) & 0o111 ? true : false;
}

Deno.test("happy: installs both hooks as executable files", async () => {
  const dir = await gitRepo();
  installHooks(`${dir}/.git`, PROJECT_ROOT);

  assert(await isExecutable(`${dir}/.git/hooks/pre-commit`));
  assert(await isExecutable(`${dir}/.git/hooks/commit-msg`));
  await Deno.remove(dir, { recursive: true });
});

Deno.test("happy: each hook is a thin wrapper that execs a Deno entrypoint", async () => {
  const dir = await gitRepo();
  installHooks(`${dir}/.git`, PROJECT_ROOT);

  const preCommit = await Deno.readTextFile(`${dir}/.git/hooks/pre-commit`);
  const commitMsg = await Deno.readTextFile(`${dir}/.git/hooks/commit-msg`);
  assert(preCommit.includes("pre-commit-hook.ts"));
  assert(commitMsg.includes("commit-msg-hook.ts"));
  assert(preCommit.startsWith("#!"));
  assert(commitMsg.startsWith("#!"));
  await Deno.remove(dir, { recursive: true });
});

Deno.test("edge: re-running the installer overwrites cleanly (idempotent)", async () => {
  const dir = await gitRepo();
  installHooks(`${dir}/.git`, PROJECT_ROOT);
  installHooks(`${dir}/.git`, PROJECT_ROOT);

  const preCommit = await Deno.readTextFile(`${dir}/.git/hooks/pre-commit`);
  assertEquals(preCommit.split("pre-commit-hook.ts").length, 2);
  await Deno.remove(dir, { recursive: true });
});

Deno.test("logical-limits: a fixture commit with no receipt is blocked by the installed pre-commit hook", async () => {
  const dir = await gitRepo();
  installHooks(`${dir}/.git`, PROJECT_ROOT);
  await Deno.writeTextFile(`${dir}/f.txt`, "hello\n");
  sh(dir, ["add", "f.txt"]);

  const result = sh(dir, ["commit", "-m", "should be blocked"]);

  assertEquals(result.code, 1);
  assert(result.stderr.includes("deno task precommit"));
  await Deno.remove(dir, { recursive: true });
});
