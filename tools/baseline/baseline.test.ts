import { assert, assertEquals } from "@std/assert";
import { regenerateBaseline } from "./baseline.ts";
import type {
  LoadedFile,
  PersistedBaseline,
} from "../contracts/baseline-generate";

const DENO_JSON = JSON.stringify({
  imports: { "~/": "./app/", "contracts/": "./shared/contracts/" },
});

const LONG_BODY = Array.from(
  { length: 25 },
  (_unused, index) => `  const v${index} = ${index};`,
).join("\n");
const VIOLATING_SOURCE =
  `export function tooLong() {\n${LONG_BODY}\n  return v0;\n}\n`;

function withTempRepo(run: (repoRoot: string) => void): void {
  const repoRoot = Deno.makeTempDirSync();
  Deno.writeTextFileSync(`${repoRoot}/deno.json`, DENO_JSON);
  const dir = `${repoRoot}/app/entities/thing/model`;
  Deno.mkdirSync(dir, { recursive: true });
  Deno.writeTextFileSync(`${dir}/thing.ts`, VIOLATING_SOURCE);
  try {
    run(repoRoot);
  } finally {
    Deno.removeSync(repoRoot, { recursive: true });
  }
}

function filesFor(repoRoot: string): readonly LoadedFile[] {
  const relativePath = "app/entities/thing/model/thing.ts";
  return [{
    absolutePath: `${repoRoot}/${relativePath}`,
    source: VIOLATING_SOURCE,
  }];
}

Deno.test("happy: a first-time generation with no previous baseline always approves", () => {
  withTempRepo((repoRoot) => {
    const result = regenerateBaseline({
      repoRoot,
      files: filesFor(repoRoot),
      paths: ["app/entities/thing/model/thing.ts"],
      previous: null,
      options: { allowIncrease: false, reason: null },
    });
    assert(result.ok);
    assert(
      result.ok && Object.keys(result.baseline.violations).length > 0,
      "a genuinely violating fixture must produce at least one violation",
    );
  });
});

function frozenBaseline(overCount: number): PersistedBaseline {
  return {
    version: 1,
    generatedAt: "2026-08-19T00:00:00Z",
    paths: ["app/entities/thing/model/thing.ts"],
    violations: { "some-identity-not-produced-now": overCount },
    perFile: { "app/entities/thing/model/thing.ts": overCount },
    perRule: { "structural/body-length": overCount },
    log: [],
  };
}

Deno.test("sad: a per-rule count increase over the frozen baseline is refused", () => {
  withTempRepo((repoRoot) => {
    const result = regenerateBaseline({
      repoRoot,
      files: filesFor(repoRoot),
      paths: ["app/entities/thing/model/thing.ts"],
      previous: frozenBaseline(0),
      options: { allowIncrease: false, reason: null },
    });
    assert(!result.ok);
    assert(
      !result.ok &&
        result.increases.some((increase) => increase.kind === "rule"),
    );
  });
});

Deno.test("edge: --allow-increase overrides the refusal and logs the reason", () => {
  withTempRepo((repoRoot) => {
    const result = regenerateBaseline({
      repoRoot,
      files: filesFor(repoRoot),
      paths: ["app/entities/thing/model/thing.ts"],
      previous: frozenBaseline(0),
      options: { allowIncrease: true, reason: "intentional test increase" },
    });
    assert(result.ok);
    const lastEntry = result.ok
      ? result.baseline.log[result.baseline.log.length - 1]
      : undefined;
    assertEquals(lastEntry?.reason, "intentional test increase");
    assertEquals(lastEntry?.allowedIncrease, true);
  });
});
