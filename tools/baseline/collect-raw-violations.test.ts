import { assert, assertEquals } from "@std/assert";
import { collectRawViolations } from "./collect-raw-violations.ts";
import { activeViolationRecorder } from "../lint-plugins/shared/violation-recorder.ts";

const DENO_JSON = JSON.stringify({
  imports: { "~/": "./app/", "contracts/": "./shared/contracts/" },
});

function withTempRepo(
  relativePath: string,
  source: string,
  run: (repoRoot: string, absolutePath: string) => void,
): void {
  const repoRoot = Deno.makeTempDirSync();
  Deno.writeTextFileSync(`${repoRoot}/deno.json`, DENO_JSON);
  const absolutePath = `${repoRoot}/${relativePath}`;
  const dir = absolutePath.slice(0, absolutePath.lastIndexOf("/"));
  Deno.mkdirSync(`${dir}/contracts`, { recursive: true });
  Deno.writeTextFileSync(`${dir}/contracts/thing.ts`, "export const c = 1;\n");
  Deno.writeTextFileSync(absolutePath, source);
  try {
    run(repoRoot, absolutePath);
  } finally {
    Deno.removeSync(repoRoot, { recursive: true });
  }
}

Deno.test("happy: a clean file produces no raw violations", () => {
  withTempRepo(
    "app/features/f1/index.ts",
    "export const f1 = 1;\n",
    (repoRoot, absolutePath) => {
      const raw = collectRawViolations(repoRoot, [{
        absolutePath,
        source: "export const f1 = 1;\n",
      }]);
      assertEquals(raw, []);
    },
  );
});

Deno.test("sad: a slice index.ts using export * is captured with the right ruleId", () => {
  const source = 'export * from "./model/thing.ts";\n';
  withTempRepo(
    "app/features/f1/index.ts",
    source,
    (repoRoot, absolutePath) => {
      const raw = collectRawViolations(repoRoot, [{ absolutePath, source }]);
      const starExport = raw.find((violation) =>
        violation.ruleId === "boundary/no-star-export"
      );
      assert(starExport, "expected a boundary/no-star-export finding");
      assertEquals(starExport?.path, "app/features/f1/index.ts");
      assert((starExport?.identity.length ?? 0) > 0);
    },
  );
});

Deno.test("logical-limits: the active recorder is cleared after the scan finishes", () => {
  const source = "export const f1 = 1;\n";
  withTempRepo(
    "app/features/f1/index.ts",
    source,
    (repoRoot, absolutePath) => {
      collectRawViolations(repoRoot, [{ absolutePath, source }]);
      assertEquals(activeViolationRecorder.current, null);
    },
  );
});
