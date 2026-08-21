import { assertEquals, assertNotEquals } from "@std/assert";
import { fingerprintStatements } from "./body-fingerprint.ts";

function range(start: number, end: number): readonly [number, number] {
  return [start, end];
}

const SRC = "const a = 1;\nconst b = 2;\nconst c = 3;\nconst d = 4;\n";
// ranges of the four statements above, byte-accurate.
const S1 = { range: range(0, 12) };
const S2 = { range: range(13, 25) };
const S3 = { range: range(26, 38) };
const S4 = { range: range(39, 51) };

Deno.test("happy: stable hash across repeated calls", () => {
  const first = fingerprintStatements([S1, S2, S3], SRC);
  const second = fingerprintStatements([S1, S2, S3], SRC);
  assertEquals(first, second);
});

Deno.test("sad: different statement text produces a different hash", () => {
  const firstHash = fingerprintStatements([S1], SRC);
  const secondHash = fingerprintStatements([S2], SRC);
  assertNotEquals(firstHash, secondHash);
});

Deno.test("edge: fewer than 3 statements hashes what is present", () => {
  const withOne = fingerprintStatements([S1], SRC);
  const withOneAgain = fingerprintStatements([S1], SRC);
  assertEquals(withOne, withOneAgain);
});

Deno.test("edge: a 4th statement beyond the first 3 does not change the hash", () => {
  const three = fingerprintStatements([S1, S2, S3], SRC);
  const four = fingerprintStatements([S1, S2, S3, S4], SRC);
  assertEquals(three, four);
});

Deno.test("edge: a blank statement is skipped when selecting the first 3", () => {
  const blank = { range: range(12, 13) }; // just the newline
  const withBlankFirst = fingerprintStatements([blank, S1, S2, S3], SRC);
  const withoutBlank = fingerprintStatements([S1, S2, S3], SRC);
  assertEquals(withBlankFirst, withoutBlank);
});

Deno.test("mutation-guard: the same statement text moved to a different range still collides", () => {
  // Same text content ("const a = 1;") appearing at a different offset must
  // produce the identical fingerprint -- this is what makes moving a
  // violation down the file unable to "fix" it.
  const movedSrc = "// a leading comment that shifts everything\n" + SRC;
  const shifted = { range: range(44, 56) };
  const original = fingerprintStatements([S1], SRC);
  const moved = fingerprintStatements([shifted], movedSrc);
  assertEquals(original, moved);
});

Deno.test("logical-limits: empty statement list hashes to a stable constant", () => {
  const emptyHash = fingerprintStatements([], SRC);
  const otherEmptyHash = fingerprintStatements([], "different source entirely");
  assertEquals(emptyHash, otherEmptyHash);
});
