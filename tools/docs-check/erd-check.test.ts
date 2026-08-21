import { assert, assertEquals } from "@std/assert";
import { checkErdMarkdown } from "./erd-check.ts";

Deno.test("happy: the repository ERD binds its tests and reports pending debt", () => {
  const result = checkErdMarkdown(
    Deno.readTextFileSync("ERD.md"),
    Deno.cwd(),
  );
  assertEquals(result.pending, 3);
  assertEquals(result.failures, []);
});

Deno.test("sad: a missing file and non-literal binding fail loudly", () => {
  const result = checkErdMarkdown(
    [
      "# ERD",
      "## Entity: Room",
      "**Invariants**",
      '1. `ROOM-INV-1`: x. Proven by: `missing.test.ts` :: "never"',
      "2. `ROOM-INV-2`: y. Proven by: `room.test.ts` :: value",
    ].join("\n"),
    Deno.cwd(),
  );
  assert(
    result.failures.some((failure) => failure.includes("missing.test.ts")),
  );
  assert(result.failures.some((failure) => failure.includes("non-literal")));
});

Deno.test("edge (Trap 1): a PENDING marker in this document's own format-contract prose is not counted", () => {
  const result = checkErdMarkdown(
    [
      "# ERD",
      "## Format contract",
      "- `Proven by: PENDING — <reason>` marks an invariant that is true of",
      "  the design but not yet proven. This format-contract section itself",
      "  contains the literal string PENDING, and a grep-based checker would",
      "  wrongly count this line.",
      "",
      "## Entity: Room",
      "**Invariants**",
      '1. `ROOM-INV-1`: x. Proven by: `room.test.ts` :: "real test"',
    ].join("\n"),
    Deno.cwd(),
  );
  assertEquals(result.pending, 0);
});

const WRAPPED_ERD = [
  "# ERD",
  "## Entity: Room",
  "**Invariants**",
  "1. `ROOM-INV-1`: a wrapped reference.",
  "   Proven by: `room.test.ts` ::",
  '   "a wrapped test name"',
].join("\n");

Deno.test("edge (Trap 2): a deno-fmt-wrapped reference spanning 3 physical lines still resolves", () => {
  const root = Deno.makeTempDirSync();
  try {
    Deno.writeTextFileSync(
      `${root}/room.test.ts`,
      'Deno.test("a different test", () => {});',
    );
    const result = checkErdMarkdown(WRAPPED_ERD, root);
    assertEquals(result.failures, [
      'ROOM-INV-1: missing literal test "a wrapped test name" in room.test.ts',
    ]);
  } finally {
    Deno.removeSync(root, { recursive: true });
  }
});

function makeDriftFixtureRoot(): string {
  const root = Deno.makeTempDirSync();
  Deno.mkdirSync(`${root}/server/entities/room-store`, { recursive: true });
  Deno.writeTextFileSync(
    `${root}/server/entities/room-store/room-store.ts`,
    "export const notAFactory = 1;",
  );
  Deno.writeTextFileSync(
    `${root}/room.test.ts`,
    'Deno.test("real test", () => {});',
  );
  return root;
}

Deno.test("logical-limits: ERD-CODE DRIFT is reported separately from failures, never fails the exit code alone", () => {
  const root = makeDriftFixtureRoot();
  try {
    const result = checkErdMarkdown(
      [
        "# ERD",
        "## Entity: Room",
        "- **Owner**: `server/entities/room-store`",
        "**Invariants**",
        '1. `ROOM-INV-1`: x. Proven by: `room.test.ts` :: "real test"',
      ].join("\n"),
      root,
    );
    assertEquals(result.failures, []);
    assertEquals(result.drift, 1);
    assert(result.driftDetails[0].includes("ERD-CODE DRIFT"));
  } finally {
    Deno.removeSync(root, { recursive: true });
  }
});
