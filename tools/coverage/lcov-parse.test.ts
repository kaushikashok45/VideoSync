import { assertEquals } from "@std/assert";
import { parseLcov } from "./lcov-parse.ts";

Deno.test("happy: parses line and branch totals", () => {
  assertEquals(
    parseLcov("SF:app/a.ts\nLF:4\nLH:3\nBRF:2\nBRH:1\nend_of_record\n"),
    [{
      file: "app/a.ts",
      linesFound: 4,
      linesHit: 3,
      branchesFound: 2,
      branchesHit: 1,
    }],
  );
});

Deno.test("edge: missing branch records are zero", () => {
  assertEquals(parseLcov("SF:app/a.ts\nLF:0\nLH:0\nend_of_record\n"), [
    {
      file: "app/a.ts",
      linesFound: 0,
      linesHit: 0,
      branchesFound: 0,
      branchesHit: 0,
    },
  ]);
});
