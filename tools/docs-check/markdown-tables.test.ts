import { assertEquals } from "@std/assert";
import { tableRows } from "./markdown-tables.ts";

Deno.test("happy: header and separator rows are dropped, cells are trimmed", () => {
  const rows = tableRows(
    "prose\n| A | B |\n|---|---|\n| one | two |\n| three | four |\n",
  );
  assertEquals(rows, [["one", "two"], ["three", "four"]]);
});

Deno.test("sad: a section with no table produces no rows", () => {
  assertEquals(tableRows("just prose, no pipes here"), []);
});

Deno.test("edge: a table wrapped by deno fmt across extra blank lines still parses", () => {
  const rows = tableRows(
    "### Heading\n\n| Term | Note |\n|---|---|\n| `x` | y |\n",
  );
  assertEquals(rows, [["`x`", "y"]]);
});
