import { assertEquals } from "@std/assert";
import { countProgramExports } from "./export-count.ts";

function bodyOf(source: string): readonly Deno.lint.Statement[] {
  let captured: readonly Deno.lint.Statement[] = [];
  const probe: Deno.lint.Plugin = {
    name: "probe",
    rules: {
      capture: {
        create(_context) {
          return {
            Program(node) {
              captured = node.body;
            },
          };
        },
      },
    },
  };
  Deno.lint.runPlugin(probe, "probe.ts", source);
  return captured;
}

Deno.test("happy: two named exports count as two", () => {
  const body = bodyOf("export const a = 1;\nexport const b = 2;\n");
  assertEquals(countProgramExports(body), 2);
});

Deno.test("sad: a single named export counts as one", () => {
  const body = bodyOf("export const a = 1;\n");
  assertEquals(countProgramExports(body), 1);
});

Deno.test("edge: a non-exported statement contributes zero", () => {
  const body = bodyOf("const a = 1;\n");
  assertEquals(countProgramExports(body), 0);
});

Deno.test("edge: an export default counts as exactly one", () => {
  const body = bodyOf("export default function f() {}\n");
  assertEquals(countProgramExports(body), 1);
});

Deno.test("edge: a re-export list counts each specifier", () => {
  const body = bodyOf('export { a, b, c } from "./x.ts";\n');
  assertEquals(countProgramExports(body), 3);
});

Deno.test("edge: export * from is conservatively counted as one (documented blind spot)", () => {
  const body = bodyOf('export * from "./x.ts";\n');
  assertEquals(countProgramExports(body), 1);
});

Deno.test("edge: a multi-declarator export counts each declarator", () => {
  const body = bodyOf("export const a = 1, b = 2;\n");
  assertEquals(countProgramExports(body), 2);
});
