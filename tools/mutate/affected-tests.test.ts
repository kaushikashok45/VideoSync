import { assertEquals } from "@std/assert";
import { affectedTests } from "./affected-tests.ts";

Deno.test("happy: reverse reachability finds direct and transitive tests", () => {
  assertEquals(
    affectedTests("src/a.ts", [
      {
        from: "tests/a.test.ts",
        to: "src/a.ts",
        fromSlice: null,
        toSlice: null,
      },
      { from: "src/b.ts", to: "src/a.ts", fromSlice: null, toSlice: null },
      {
        from: "tests/b.test.ts",
        to: "src/b.ts",
        fromSlice: null,
        toSlice: null,
      },
    ]),
    ["tests/a.test.ts", "tests/b.test.ts"],
  );
});

Deno.test("edge: cycles do not repeat affected tests", () => {
  assertEquals(
    affectedTests("src/a.ts", [
      { from: "src/b.ts", to: "src/a.ts", fromSlice: null, toSlice: null },
      { from: "src/a.ts", to: "src/b.ts", fromSlice: null, toSlice: null },
      {
        from: "tests/a.test.ts",
        to: "src/a.ts",
        fromSlice: null,
        toSlice: null,
      },
    ]),
    ["tests/a.test.ts"],
  );
});
