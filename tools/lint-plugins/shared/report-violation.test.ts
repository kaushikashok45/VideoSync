import { assert, assertEquals, assertFalse } from "@std/assert";
import { reportViolation } from "./report-violation.ts";
import { loadSuppressor } from "./suppress.ts";
import { activeViolationRecorder } from "./violation-recorder.ts";
import { violationIdentity } from "../../baseline/identity.ts";
import type { ViolationSite } from "../../contracts/identity";

const REPO_ROOT = "/repo";

function fakeContext(filename: string) {
  const reports: Array<{ range: Deno.lint.Range; message: string }> = [];
  return {
    filename,
    report: (entry: { range: Deno.lint.Range; message: string }) => {
      reports.push(entry);
    },
    reports,
  };
}

function reportSample(
  context: ReturnType<typeof fakeContext>,
  suppressor: {
    loaded: boolean;
    isKnown: (path: string, id: string) => boolean;
  },
): void {
  reportViolation({
    context,
    suppressor,
    repoRoot: REPO_ROOT,
    site: SITE,
    range: [0, 1],
    message: "m",
  });
}

function baselineAt(
  paths: readonly string[],
  violations: Record<string, number>,
) {
  const dir = Deno.makeTempDirSync();
  const path = `${dir}/baseline.json`;
  Deno.writeTextFileSync(
    path,
    JSON.stringify({
      version: 1,
      generatedAt: "2026-08-19T00:00:00Z",
      paths,
      violations,
      perFile: {},
    }),
  );
  return path;
}

const SITE: ViolationSite = {
  ruleId: "structural/complexity",
  enclosingFunction: "doThing",
  paramCount: -1,
  bodyFingerprint: "abc",
  sliceKey: null,
};

Deno.test("happy: a known identity in a known path is suppressed silently", () => {
  const id = violationIdentity(SITE);
  const baselinePath = baselineAt(["app/entities/room/model/room.ts"], {
    [id]: 1,
  });
  const suppressor = loadSuppressor(baselinePath);
  const ctx = fakeContext(`${REPO_ROOT}/app/entities/room/model/room.ts`);
  reportViolation({
    context: ctx,
    suppressor,
    repoRoot: REPO_ROOT,
    site: SITE,
    range: [0, 1],
    message: "too complex",
  });
  assertEquals(ctx.reports.length, 0);
});

Deno.test("sad: reported when the path is absent from the baseline (new-path zero tolerance)", () => {
  const baselinePath = baselineAt(["app/entities/other/model/x.ts"], {
    "some-identity": 5,
  });
  const suppressor = loadSuppressor(baselinePath);
  const ctx = fakeContext(`${REPO_ROOT}/app/entities/room/model/room.ts`);
  reportViolation({
    context: ctx,
    suppressor,
    repoRoot: REPO_ROOT,
    site: SITE,
    range: [0, 1],
    message: "too complex",
  });
  assertEquals(ctx.reports.length, 1);
});

Deno.test("edge: fail-closed -- with no baseline present, everything reports", () => {
  const suppressor = loadSuppressor("/nonexistent/baseline.json");
  assertFalse(suppressor.loaded);
  const ctx = fakeContext(`${REPO_ROOT}/app/entities/room/model/room.ts`);
  reportViolation({
    context: ctx,
    suppressor,
    repoRoot: REPO_ROOT,
    site: SITE,
    range: [0, 1],
    message: "too complex",
  });
  assertEquals(ctx.reports.length, 1);
});

Deno.test("edge: the path conversion strips repoRoot before consulting the suppressor", () => {
  const absolute = `${REPO_ROOT}/app/entities/room/model/room.ts`;
  const relative = "app/entities/room/model/room.ts";
  let seenPath = "";
  const suppressor = {
    loaded: true,
    isKnown: (path: string, _id: string) => {
      seenPath = path;
      return true;
    },
  };
  const ctx = fakeContext(absolute);
  reportSample(ctx, suppressor);
  assertEquals(seenPath, relative);
  assert(ctx.reports.length === 0);
});

Deno.test("mutation-guard: suppression truly gates report -- flipping isKnown flips behavior", () => {
  const alwaysSuppress = { loaded: true, isKnown: () => true };
  const neverSuppress = { loaded: true, isKnown: () => false };
  const ctxA = fakeContext(`${REPO_ROOT}/x.ts`);
  const ctxB = fakeContext(`${REPO_ROOT}/x.ts`);
  reportSample(ctxA, alwaysSuppress);
  reportSample(ctxB, neverSuppress);
  assertEquals(ctxA.reports.length, 0);
  assertEquals(ctxB.reports.length, 1);
});

Deno.test("logical-limits: the active recorder fires even when the suppressor hides the report", () => {
  const seen: Array<[string, string]> = [];
  activeViolationRecorder.current = (path, id) => seen.push([path, id]);
  try {
    const ctx = fakeContext(`${REPO_ROOT}/x.ts`);
    reportSample(ctx, { loaded: true, isKnown: () => true });
    assertEquals(ctx.reports.length, 0);
    assertEquals(seen.length, 1);
    assertEquals(seen[0][0], "x.ts");
  } finally {
    activeViolationRecorder.current = null;
  }
});
