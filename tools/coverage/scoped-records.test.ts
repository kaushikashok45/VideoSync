import { assertEquals } from "@std/assert";
import { scopedRecords } from "./scoped-records.ts";

const REPO_ROOT = "/repo";

function lcovBlock(absoluteFile: string, branches = "BRF:2\nBRH:1\n"): string {
  return `SF:${absoluteFile}\nLF:4\nLH:3\n${branches}end_of_record\n`;
}

Deno.test("happy: relativizes an absolute SF: path before matching changedFiles", () => {
  const lcov = lcovBlock(`${REPO_ROOT}/app/features/chat/model/store.ts`);
  const records = scopedRecords(
    REPO_ROOT,
    lcov,
    false,
    ["app/features/chat/model/store.ts"],
  );
  assertEquals(records.length, 1);
  assertEquals(records[0].file, "app/features/chat/model/store.ts");
});

Deno.test("sad: without relativizing, an absolute SF: never matches a relative changed list", () => {
  // Regression for the bug this module fixes: comparing the raw (absolute)
  // SF: path against a repo-relative changed list always misses, silently
  // passing the floor with zero records. This asserts the *fixed* behavior.
  const lcov = lcovBlock(`${REPO_ROOT}/app/features/chat/model/store.ts`);
  const records = scopedRecords(REPO_ROOT, lcov, false, ["not-this-file.ts"]);
  assertEquals(records, []);
});

Deno.test("edge: a props-only presentation file is exempt even if changed", () => {
  const lcov = lcovBlock(`${REPO_ROOT}/app/features/chat/ui/Panel.tsx`);
  const records = scopedRecords(
    REPO_ROOT,
    lcov,
    false,
    ["app/features/chat/ui/Panel.tsx"],
  );
  assertEquals(records, []);
});

Deno.test("edge: a changed file outside model/api/lib/entities is out of scope", () => {
  const lcov = lcovBlock(`${REPO_ROOT}/tools/cli/governed-diff.ts`);
  const records = scopedRecords(
    REPO_ROOT,
    lcov,
    false,
    ["tools/cli/governed-diff.ts"],
  );
  assertEquals(records, []);
});

Deno.test("logical-limits: --all includes an in-scope file even if unchanged", () => {
  const lcov = lcovBlock(`${REPO_ROOT}/server/features/room/api/handler.ts`);
  const records = scopedRecords(REPO_ROOT, lcov, true, []);
  assertEquals(records.length, 1);
});

Deno.test("mutation-guard: branch percentages compute independently of line percentages", () => {
  const lcov = lcovBlock(
    `${REPO_ROOT}/app/entities/room/model/room.ts`,
    "BRF:4\nBRH:0\n",
  );
  const records = scopedRecords(
    REPO_ROOT,
    lcov,
    false,
    ["app/entities/room/model/room.ts"],
  );
  assertEquals(records[0].branchesFound, 4);
  assertEquals(records[0].branchesHit, 0);
});
