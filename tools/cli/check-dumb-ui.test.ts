import { assert, assertEquals } from "@std/assert";
import { runCheckDumbUi } from "./check-dumb-ui.ts";

const REPO_ROOT = new URL("../../", import.meta.url).pathname.replace(
  /\/$/,
  "",
);

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
  const { code } = await captureLogs(() => runCheckDumbUi([]));
  assertEquals(code, 2);
});

Deno.test("sad: --changed with no staged files exits clean (0), not as a violation", async () => {
  const dir = await gitRepo();
  const { code } = await inRepo(
    dir,
    () => captureLogs(() => runCheckDumbUi(["--changed"])),
  );
  assertEquals(code, 0);
  await Deno.remove(dir, { recursive: true });
});

Deno.test("sad: --changed outside a git repo is a harness error (exit 2), never a silent empty diff", async () => {
  const dir = await Deno.makeTempDir();
  const { code, lines } = await inRepo(
    dir,
    () => captureLogs(() => runCheckDumbUi(["--changed"])),
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
    () => captureLogs(() => runCheckDumbUi(["--changed"])),
  );
  assertEquals(code, 0);
  await Deno.remove(dir, { recursive: true });
});

Deno.test("edge: an unknown flag is a harness error, not treated as --all", async () => {
  // A typo must never silently widen or narrow scope: exit 2 so it is visible.
  const { code } = await captureLogs(() => runCheckDumbUi(["--everything"]));
  assertEquals(code, 2);
});

Deno.test("happy: --all is clean (0) now that the ratchet baseline is seeded", async () => {
  const { code, lines } = await captureLogs(() => runCheckDumbUi(["--all"]));
  assertEquals(code, 0);
  assertEquals(lines.filter((line) => line.includes("dumb-ui/")).length, 0);
});

async function withFixtureDir<T>(
  absoluteDir: string,
  write: () => Promise<void>,
  run: () => Promise<T>,
): Promise<T> {
  await Deno.mkdir(absoluteDir, { recursive: true });
  try {
    await write();
    return await run();
  } finally {
    await Deno.remove(absoluteDir, { recursive: true });
  }
}

const LOCAL_STATE_FIXTURE = 'import { useState } from "react";\n' +
  "export function Thing() {\n" +
  "  const [value] = useState(0);\n" +
  "  return value;\n" +
  "}\n";

Deno.test("mutation-guard: a brand-new presentation file with real local state exits 1 and prints the finding", async () => {
  // New-path zero tolerance: a path absent from the seeded baseline is never
  // suppressed, so a fresh presentation file using `useState` must still
  // surface. This pins the violation/clean distinction now that the live
  // tree itself is clean.
  const parentDir = `${REPO_ROOT}/app/widgets/__check_dumb_ui_mutation_guard__`;
  const uiDir = `${parentDir}/ui`;
  const { code, lines } = await withFixtureDir(
    parentDir,
    async () => {
      await Deno.mkdir(uiDir, { recursive: true });
      await Deno.writeTextFile(`${uiDir}/thing.tsx`, LOCAL_STATE_FIXTURE);
    },
    () => captureLogs(() => runCheckDumbUi(["--all"])),
  );
  assertEquals(code, 1);
  assert(
    lines.some((line) => line.includes("dumb-ui/")),
    "findings must carry the dumb-ui/ code prefix so the CLI can filter by plugin",
  );
});
