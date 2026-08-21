import { assert, assertEquals } from "@std/assert";
import structuralPlugin from "./structural.ts";
import boundaryPlugin from "./boundary.ts";
import dumbUiPlugin from "./dumb-ui.ts";
import semanticsPlugin from "./semantics.ts";

const ENTRIES: ReadonlyArray<
  { readonly name: string; readonly plugin: Deno.lint.Plugin }
> = [
  { name: "structural", plugin: structuralPlugin },
  { name: "boundary", plugin: boundaryPlugin },
  { name: "dumb-ui", plugin: dumbUiPlugin },
  { name: "semantics", plugin: semanticsPlugin },
];

Deno.test("happy: every entry's default export is a real plugin bound to the real repo root", () => {
  for (const entry of ENTRIES) {
    assertEquals(entry.plugin.name, entry.name);
    assert(Object.keys(entry.plugin.rules).length > 0);
  }
});
