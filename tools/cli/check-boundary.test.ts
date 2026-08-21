import { assert, assertEquals } from "@std/assert";
import { runCheckBoundary } from "./check-boundary.ts";

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
  const { code } = await captureLogs(() => runCheckBoundary([]));
  assertEquals(code, 2);
});

Deno.test("sad: --changed with no staged files exits clean (0), not as a violation", async () => {
  const dir = await gitRepo();
  const { code } = await inRepo(
    dir,
    () => captureLogs(() => runCheckBoundary(["--changed"])),
  );
  assertEquals(code, 0);
  await Deno.remove(dir, { recursive: true });
});

Deno.test("sad: --changed outside a git repo is a harness error (exit 2), never a silent empty diff", async () => {
  const dir = await Deno.makeTempDir();
  const { code, lines } = await inRepo(
    dir,
    () => captureLogs(() => runCheckBoundary(["--changed"])),
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
    () => captureLogs(() => runCheckBoundary(["--changed"])),
  );
  assertEquals(code, 0);
  await Deno.remove(dir, { recursive: true });
});

Deno.test("edge: an unknown flag is a harness error, not treated as --all", async () => {
  // A typo must never silently widen or narrow scope: exit 2 so it is visible.
  const { code } = await captureLogs(() => runCheckBoundary(["--everything"]));
  assertEquals(code, 2);
});

Deno.test("happy: --all is clean (0) now that the ratchet baseline is seeded", async () => {
  const { code, lines } = await captureLogs(() => runCheckBoundary(["--all"]));
  assertEquals(code, 0);
  assertEquals(lines.filter((line) => line.includes("boundary/")).length, 0);
});

async function withFixtureDir<T>(
  relativeDir: string,
  write: (absoluteDir: string) => Promise<void>,
  run: () => Promise<T>,
): Promise<T> {
  const absoluteDir = `${REPO_ROOT}/${relativeDir}`;
  await Deno.mkdir(absoluteDir, { recursive: true });
  try {
    await write(absoluteDir);
    return await run();
  } finally {
    await Deno.remove(absoluteDir, { recursive: true });
  }
}

Deno.test("mutation-guard: a brand-new file with a real boundary violation exits 1 and prints the finding", async () => {
  // New-path zero tolerance (docs/GOVERNANCE.md, "ratchet baseline"): a path
  // absent from the seeded baseline is never suppressed, so a fresh file
  // with a genuine violation must still surface. This pins the
  // violation/clean distinction now that the live tree itself is clean.
  const { code, lines } = await withFixtureDir(
    "app/features/__check_boundary_mutation_guard__",
    (absoluteDir) =>
      Deno.writeTextFile(
        `${absoluteDir}/deep-import.ts`,
        'import { onSetupConfirm } from "~/features/entry-flow/components/setup-screen.tsx";\n' +
          "export const x = onSetupConfirm;\n",
      ),
    () => captureLogs(() => runCheckBoundary(["--all"])),
  );
  assertEquals(code, 1);
  assert(
    lines.some((line) => line.includes("boundary/")),
    "findings must carry the boundary/ code prefix so the CLI can filter by plugin",
  );
});

function linesContaining(lines: string[], needle: string): string[] {
  return lines.filter((line) => line.includes(needle));
}

async function writeSliceLatchFixture(absoluteDir: string): Promise<void> {
  await Deno.mkdir(`${absoluteDir}/model`, { recursive: true });
  for (const name of ["a", "b", "c"]) {
    await Deno.writeTextFile(
      `${absoluteDir}/model/${name}.ts`,
      `export const ${name} = 1;\n`,
    );
  }
}

const SLICE_LATCH_DIR = "app/features/__check_boundary_slice_latch_fixture__";

function assertReportedOnce(
  lines: readonly string[],
  code: string,
  label: string,
): void {
  const matches = linesContaining([...lines], code)
    .filter((line) => line.includes(SLICE_LATCH_DIR));
  assertEquals(matches.length, 1, `${label} must report exactly once`);
}

Deno.test("logical-limits: --all reports slice-level rules once per slice, not once per file", async () => {
  // D-007: missing-index and missing-contract are properties of a slice, but a
  // lint plugin runs per file. Without the claimReport latch a 3-file new
  // slice (new-path zero tolerance keeps it unsuppressed) would emit 3
  // identical diagnostics per rule instead of 1.
  const { lines } = await withFixtureDir(
    SLICE_LATCH_DIR,
    writeSliceLatchFixture,
    () => captureLogs(() => runCheckBoundary(["--all"])),
  );
  assertReportedOnce(
    lines,
    "boundary/missing-index",
    "a slice missing index.ts",
  );
  assertReportedOnce(
    lines,
    "boundary/missing-contract",
    "a slice missing contracts/",
  );
});
