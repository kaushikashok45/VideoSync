import { assert, assertEquals } from "@std/assert";
import { runCheckStructural } from "./check-structural.ts";

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

function captureLogs(
  run: () => Promise<number>,
): Promise<{ code: number; lines: string[] }> {
  const lines: string[] = [];
  const originalLog = console.log;
  const originalError = console.error;
  console.log = (msg: string) => lines.push(msg);
  console.error = (msg: string) => lines.push(msg);
  return run().then((code) => ({ code, lines })).finally(() => {
    console.log = originalLog;
    console.error = originalError;
  });
}

Deno.test("happy: no flag arguments is a harness error, not a silent empty run", async () => {
  const { code } = await captureLogs(() => runCheckStructural([]));
  assertEquals(code, 2);
});

Deno.test("sad: --changed with no staged files exits clean (0), not as a violation", async () => {
  const dir = await gitRepo();
  const { code } = await inRepo(
    dir,
    () => captureLogs(() => runCheckStructural(["--changed"])),
  );
  assertEquals(code, 0);
  await Deno.remove(dir, { recursive: true });
});

Deno.test("sad: --changed outside a git repo is a harness error (exit 2), never a silent empty diff", async () => {
  const dir = await Deno.makeTempDir();
  const { code, lines } = await inRepo(
    dir,
    () => captureLogs(() => runCheckStructural(["--changed"])),
  );
  assertEquals(code, 2);
  assert(lines.length > 0);
  await Deno.remove(dir, { recursive: true });
});

Deno.test("edge: --changed ignores non-.ts/.tsx files in scope", async () => {
  const dir = await gitRepo();
  await Deno.writeTextFile(`${dir}/README.md`, "# hi\n");
  sh(dir, ["add", "README.md"]);
  const { code } = await inRepo(
    dir,
    () => captureLogs(() => runCheckStructural(["--changed"])),
  );
  assertEquals(code, 0);
  await Deno.remove(dir, { recursive: true });
});

Deno.test("logical-limits: --all walks app/server/shared/tools relative to the real repo, never throwing", async () => {
  // Run from the real repository: exercises the actual tree without
  // requiring a violation-free result, since the baseline is not seeded yet
  // and legacy files are expected to report freely (D-006).
  const { code } = await captureLogs(() => runCheckStructural(["--all"]));
  assert(code === 0 || code === 1);
});
