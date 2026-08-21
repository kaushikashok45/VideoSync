import { assert, assertFalse } from "@std/assert";
import { loadSuppressor } from "./suppress.ts";

async function withBaseline(
  content: string,
  run: (path: string) => void | Promise<void>,
) {
  const dir = await Deno.makeTempDir();
  const path = `${dir}/baseline.json`;
  await Deno.writeTextFile(path, content);
  try {
    await run(path);
  } finally {
    await Deno.remove(dir, { recursive: true });
  }
}

const VALID_BASELINE = JSON.stringify({
  version: 1,
  generatedAt: "2026-08-19T00:00:00.000Z",
  paths: ["app/entities/room/room-store.ts"],
  violations: { "abc123": 2, "zero-count": 0 },
  perFile: { "app/entities/room/room-store.ts": 2 },
});

Deno.test("happy: known identity in a known path is suppressed", async () => {
  await withBaseline(VALID_BASELINE, (path) => {
    const suppressor = loadSuppressor(path);
    assert(suppressor.loaded);
    assert(suppressor.isKnown("app/entities/room/room-store.ts", "abc123"));
  });
});

Deno.test("sad: absent baseline file fails closed", () => {
  const suppressor = loadSuppressor("/nonexistent/dir/baseline.json");
  assertFalse(suppressor.loaded);
  assertFalse(suppressor.isKnown("app/entities/room/room-store.ts", "abc123"));
});

Deno.test("edge: unknown path with a known identity is not suppressed (zero tolerance for new paths)", async () => {
  await withBaseline(VALID_BASELINE, (path) => {
    const suppressor = loadSuppressor(path);
    assertFalse(
      suppressor.isKnown("app/entities/room/brand-new-file.ts", "abc123"),
    );
  });
});

Deno.test("edge: known path with an unknown identity is not suppressed", async () => {
  await withBaseline(VALID_BASELINE, (path) => {
    const suppressor = loadSuppressor(path);
    assertFalse(
      suppressor.isKnown("app/entities/room/room-store.ts", "never-seen"),
    );
  });
});

Deno.test("edge: malformed JSON fails closed", async () => {
  await withBaseline("{ not valid json", (path) => {
    const suppressor = loadSuppressor(path);
    assertFalse(suppressor.loaded);
    assertFalse(
      suppressor.isKnown("app/entities/room/room-store.ts", "abc123"),
    );
  });
});

Deno.test("edge: wrong version fails closed", async () => {
  const wrongVersion = JSON.stringify({
    version: 2,
    generatedAt: "2026-08-19T00:00:00.000Z",
    paths: ["app/entities/room/room-store.ts"],
    violations: { "abc123": 2 },
    perFile: {},
  });
  await withBaseline(wrongVersion, (path) => {
    const suppressor = loadSuppressor(path);
    assertFalse(suppressor.loaded);
  });
});

Deno.test("edge: an identity with count 0 is NOT known -- zero occurrences permitted means report", async () => {
  await withBaseline(VALID_BASELINE, (path) => {
    const suppressor = loadSuppressor(path);
    // A count of 0 is a budget of zero, not a licence. Suppressing it would be a
    // fail-open hole inside a module whose whole contract is fail-closed.
    assertFalse(
      suppressor.isKnown("app/entities/room/room-store.ts", "zero-count"),
    );
  });
});

Deno.test("mutation-guard: flipping the path-set check to fail open must be caught", async () => {
  await withBaseline(VALID_BASELINE, (path) => {
    const suppressor = loadSuppressor(path);
    // A known identity, but for a path not in the baseline's path set at all.
    assertFalse(
      suppressor.isKnown("app/entities/room/does-not-exist.ts", "abc123"),
    );
  });
});

Deno.test("logical-limits: loaded === false implies isKnown is false for all inputs", async () => {
  await withBaseline("not json at all", (path) => {
    const suppressor = loadSuppressor(path);
    assertFalse(suppressor.loaded);
    const samples: Array<[string, string]> = [
      ["", ""],
      ["app/entities/room/room-store.ts", "abc123"],
      ["random/path.ts", "random-id"],
    ];
    for (const [p, id] of samples) {
      assertFalse(suppressor.isKnown(p, id));
    }
  });
});

function writeZeroCountBaselineFile(dir: string): string {
  const file = `${dir}/baseline.json`;
  Deno.writeTextFileSync(
    file,
    JSON.stringify({
      version: 1,
      generatedAt: "2026-08-19T00:00:00Z",
      paths: ["app/features/foo/model/bar.ts"],
      violations: { "zero-count-identity": 0, "real-identity": 1 },
      perFile: { "app/features/foo/model/bar.ts": 1 },
    }),
  );
  return file;
}

Deno.test("suppress: an identity with count 0 is NOT suppressed (fail closed)", () => {
  const dir = Deno.makeTempDirSync();
  const file = writeZeroCountBaselineFile(dir);
  const suppressor = loadSuppressor(file);
  assert(suppressor.loaded);
  // A count of 0 means zero occurrences are permitted, so it must report.
  assertFalse(
    suppressor.isKnown("app/features/foo/model/bar.ts", "zero-count-identity"),
  );
  // A positive count is still suppressed.
  assert(suppressor.isKnown("app/features/foo/model/bar.ts", "real-identity"));
  Deno.removeSync(dir, { recursive: true });
});
