import { assertEquals } from "@std/assert";
import { listItems } from "./list-items.ts";
import { parseSections } from "./markdown-sections.ts";

Deno.test("happy: sections isolate headings and list items join wrapped lines", () => {
  const sections = parseSections(
    '# Intro\n**Invariants** is prose here\n## Entity: Room\n**Invariants**\n\n1. `ROOM-INV-1`: first line\n   Proven by: `server/test.ts` ::\n   "named test"\n\n## Other\n',
  );
  assertEquals(sections.map((section) => section.heading), [
    "Intro",
    "Entity: Room",
    "Other",
  ]);
  assertEquals(listItems(sections[1].rawText, "**Invariants**"), [
    '`ROOM-INV-1`: first line Proven by: `server/test.ts` :: "named test"',
  ]);
});

Deno.test("sad: a missing marker produces no items", () => {
  assertEquals(listItems("1. an item", "**Invariants**"), []);
});

Deno.test("edge: prose after the list is not included", () => {
  assertEquals(
    listItems("**Invariants**\n\n1. one\n\nA paragraph", "**Invariants**"),
    ["one"],
  );
});
