import { assertEquals } from "@std/assert";
import { parseProvenBy } from "./proven-by.ts";

Deno.test("happy: parses a literal binding and sibling proofs", () => {
  assertEquals(
    parseProvenBy(
      'rule. Proven by: `server/a.test.ts` :: "first" Also proven by: "second"',
    ),
    {
      kind: "bound",
      file: "server/a.test.ts",
      tests: ["first", "second"],
    },
  );
});

Deno.test("sad: malformed test references are rejected", () => {
  assertEquals(
    parseProvenBy("Proven by: `server/a.test.ts` :: `template ${name}`"),
    { kind: "malformed", raw: "`server/a.test.ts` :: `template ${name}`" },
  );
});

Deno.test("edge: pending is a first-class result", () => {
  assertEquals(parseProvenBy("Proven by: PENDING — needs an E2E harness"), {
    kind: "pending",
  });
});
