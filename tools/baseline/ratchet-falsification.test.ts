import { assert, assertEquals } from "@std/assert";
import { regenerateBaseline } from "./baseline.ts";
import { createStructuralPlugin } from "../lint-plugins/structural-plugin.ts";
import { writeBaselineFile } from "./write-baseline.ts";
import type {
  LoadedFile,
  PersistedBaseline,
} from "../contracts/baseline-generate";

const DENO_JSON = JSON.stringify({
  imports: { "~/": "./app/", "contracts/": "./shared/contracts/" },
});

function longFileSource(lines: number): string {
  const body = Array.from(
    { length: lines },
    (_unused, index) => `export const v${index} = ${index};`,
  ).join("\n");
  return `${body}\n`;
}

function withTempRepo(run: (repoRoot: string) => void): void {
  const repoRoot = Deno.makeTempDirSync();
  Deno.writeTextFileSync(`${repoRoot}/deno.json`, DENO_JSON);
  try {
    run(repoRoot);
  } finally {
    Deno.removeSync(repoRoot, { recursive: true });
  }
}

function writeFile(repoRoot: string, relativePath: string, source: string) {
  const absolutePath = `${repoRoot}/${relativePath}`;
  const dir = absolutePath.slice(0, absolutePath.lastIndexOf("/"));
  Deno.mkdirSync(dir, { recursive: true });
  Deno.writeTextFileSync(absolutePath, source);
  return absolutePath;
}

function loadedFile(absolutePath: string, source: string): LoadedFile {
  return { absolutePath, source };
}

function seed(
  repoRoot: string,
  files: readonly LoadedFile[],
  paths: readonly string[],
): PersistedBaseline {
  const result = regenerateBaseline({
    repoRoot,
    files,
    paths,
    previous: null,
    options: { allowIncrease: false, reason: null },
  });
  assert(result.ok, "seeding fixture must succeed");
  return result.ok ? result.baseline : (() => {
    throw new Error("unreachable");
  })();
}

/** Seeds the baseline for one fixture file and writes it to `repoRoot`. */
function seedAndWriteBaseline(
  repoRoot: string,
  relativePath: string,
  absolutePath: string,
  source: string,
): PersistedBaseline {
  const baseline = seed(repoRoot, [loadedFile(absolutePath, source)], [
    relativePath,
  ]);
  Deno.mkdirSync(`${repoRoot}/tools/baseline`, { recursive: true });
  writeBaselineFile(`${repoRoot}/tools/baseline/baseline.json`, baseline);
  return baseline;
}

function fileLengthDiagnostics(
  repoRoot: string,
  absolutePath: string,
  source: string,
): readonly Deno.lint.Diagnostic[] {
  const plugin = createStructuralPlugin(repoRoot);
  return Deno.lint.runPlugin(plugin, absolutePath, source)
    .filter((diagnostic) => diagnostic.id === "structural/file-length");
}

Deno.test("happy: a clean run after seeding exits clean -- zero unsuppressed diagnostics", () => {
  withTempRepo((repoRoot) => {
    const relativePath = "app/entities/x/model/big.ts";
    const source = longFileSource(200);
    const absolutePath = writeFile(repoRoot, relativePath, source);
    seedAndWriteBaseline(repoRoot, relativePath, absolutePath, source);
    assertEquals(
      fileLengthDiagnostics(repoRoot, absolutePath, source).length,
      0,
    );
  });
});

Deno.test("sad: renaming a violating file makes it fail -- new path, zero tolerance", () => {
  withTempRepo((repoRoot) => {
    const oldPath = "app/entities/x/model/big.ts";
    const source = longFileSource(200);
    const oldAbsolute = writeFile(repoRoot, oldPath, source);
    seedAndWriteBaseline(repoRoot, oldPath, oldAbsolute, source);
    // Same content, byte-identical, but at bad.ts -> bad-2.ts: the identity
    // is unchanged but the path is absent from the frozen path set.
    const newAbsolute = `${repoRoot}/app/entities/x/model/big-2.ts`;
    Deno.writeTextFileSync(newAbsolute, source);
    assertEquals(
      fileLengthDiagnostics(repoRoot, newAbsolute, source).length,
      1,
      "a renamed file must not inherit its old file's suppression",
    );
  });
});

function writeHalves(repoRoot: string, halfSource: string): [string, string] {
  const halfA = `${repoRoot}/app/entities/x/model/big-part-a.ts`;
  const halfB = `${repoRoot}/app/entities/x/model/big-part-b.ts`;
  Deno.writeTextFileSync(halfA, halfSource);
  Deno.writeTextFileSync(halfB, halfSource);
  return [halfA, halfB];
}

Deno.test("sad: splitting a 150+ line file in two makes both halves fully compliant-or-fail", () => {
  withTempRepo((repoRoot) => {
    const oldPath = "app/entities/x/model/big.ts";
    const source = longFileSource(200);
    const oldAbsolute = writeFile(repoRoot, oldPath, source);
    seedAndWriteBaseline(repoRoot, oldPath, oldAbsolute, source);
    // Splitting into two 100-line halves both fits under the ≤150 limit --
    // this is the incentive the ratchet exists to create. Neither half's
    // path is in the frozen set, so this is the *good* outcome, not a hole:
    // the split genuinely fixed the violation, so zero tolerance finds
    // nothing to complain about.
    const halfSource = longFileSource(100);
    const [halfA, halfB] = writeHalves(repoRoot, halfSource);
    assertEquals(fileLengthDiagnostics(repoRoot, halfA, halfSource).length, 0);
    assertEquals(fileLengthDiagnostics(repoRoot, halfB, halfSource).length, 0);
  });
});

Deno.test("sad: splitting into two halves that are STILL over the limit reports both, unsuppressed", () => {
  withTempRepo((repoRoot) => {
    const oldPath = "app/entities/x/model/big.ts";
    const source = longFileSource(400);
    const oldAbsolute = writeFile(repoRoot, oldPath, source);
    seedAndWriteBaseline(repoRoot, oldPath, oldAbsolute, source);
    // Splitting a 400-line file into two still-oversized 200-line halves must
    // be *stricter*, not looser: neither new path was ever frozen, so both
    // report even though the original single 400-line violation was one
    // frozen entry.
    const halfSource = longFileSource(200);
    const [halfA, halfB] = writeHalves(repoRoot, halfSource);
    assertEquals(fileLengthDiagnostics(repoRoot, halfA, halfSource).length, 1);
    assertEquals(fileLengthDiagnostics(repoRoot, halfB, halfSource).length, 1);
  });
});

function writeZeroCountBaseline(repoRoot: string, relativePath: string): void {
  Deno.mkdirSync(`${repoRoot}/tools/baseline`, { recursive: true });
  Deno.writeTextFileSync(
    `${repoRoot}/tools/baseline/baseline.json`,
    JSON.stringify({
      version: 1,
      generatedAt: "2026-08-20T00:00:00Z",
      paths: [relativePath],
      violations: {}, // no identity carries a positive count
      perFile: {},
    }),
  );
}

Deno.test("suppression: a violation whose baseline count is 0 is NOT suppressed", () => {
  withTempRepo((repoRoot) => {
    const relativePath = "app/entities/x/model/big.ts";
    const source = longFileSource(200);
    const absolutePath = writeFile(repoRoot, relativePath, source);
    writeZeroCountBaseline(repoRoot, relativePath);
    assertEquals(
      fileLengthDiagnostics(repoRoot, absolutePath, source).length,
      1,
      "an identity absent from `violations` (count 0) must still report",
    );
  });
});

function complexFunction(name: string): string {
  return `export function ${name}(a: number): number {\n` +
    `  if (a === 1) return 1;\n  if (a === 2) return 2;\n  if (a === 3) return 3;\n  return 0;\n}\n`;
}

interface RegenAfterEditingArgs {
  readonly repoRoot: string;
  readonly relativePath: string;
  readonly absolutePath: string;
  readonly after: string;
  readonly previous: PersistedBaseline;
}

function regenAfterEditing(args: RegenAfterEditingArgs) {
  Deno.writeTextFileSync(args.absolutePath, args.after);
  return regenerateBaseline({
    repoRoot: args.repoRoot,
    files: [{ absolutePath: args.absolutePath, source: args.after }],
    paths: [args.relativePath],
    previous: args.previous,
    options: { allowIncrease: false, reason: null },
  });
}

function assertFileIncreaseRefused(
  result: ReturnType<typeof regenAfterEditing>,
): void {
  assert(!result.ok, "a third new complexity violation must refuse regen");
  assert(
    !result.ok && result.increases.some((increase) => increase.kind === "file"),
    "the per-file count for the modified file must be flagged",
  );
}

Deno.test("sad: a NEW violation added to an already-violating file is refused by baseline:regen (frozen per-file budget)", () => {
  withTempRepo((repoRoot) => {
    const relativePath = "app/entities/x/model/complex.ts";
    const before = complexFunction("first") + complexFunction("second");
    const absoluteBefore = writeFile(repoRoot, relativePath, before);
    const baseline = seed(repoRoot, [loadedFile(absoluteBefore, before)], [
      relativePath,
    ]);
    const after = before + complexFunction("third");
    const result = regenAfterEditing({
      repoRoot,
      relativePath,
      absolutePath: absoluteBefore,
      after,
      previous: baseline,
    });
    assertFileIncreaseRefused(result);
  });
});

Deno.test("logical-limits: with no baseline file present, every rule reports (fail closed)", () => {
  withTempRepo((repoRoot) => {
    const relativePath = "app/entities/x/model/big.ts";
    const source = longFileSource(200);
    const absolutePath = writeFile(repoRoot, relativePath, source);
    // No tools/baseline/baseline.json written at all in this repoRoot.
    assertEquals(
      fileLengthDiagnostics(repoRoot, absolutePath, source).length,
      1,
    );
  });
});
