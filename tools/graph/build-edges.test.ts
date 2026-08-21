import { assertEquals } from "@std/assert";
import { buildEdges } from "./build-edges.ts";

const REPO_ROOT = "/repo";

function fakeResolver(
  table: Record<string, string | null>,
): { resolve(raw: string): { absolutePath: string | null } } {
  return { resolve: (raw) => ({ absolutePath: table[raw] ?? null }) };
}

Deno.test("happy: a resolvable cross-slice import becomes one edge", () => {
  const resolver = fakeResolver({
    "~/features/f2": "/repo/app/features/f2/index.ts",
  });
  const edges = buildEdges(REPO_ROOT, resolver, [{
    absolutePath: "/repo/app/features/f1/model/x.ts",
    source: 'import { f2 } from "~/features/f2";\n',
  }]);
  assertEquals(edges, [{
    from: "app/features/f1/model/x.ts",
    to: "app/features/f2/index.ts",
    fromSlice: "app/features/f1",
    toSlice: "app/features/f2",
  }]);
});

Deno.test("sad: an unresolvable specifier produces no edge", () => {
  const resolver = fakeResolver({});
  const edges = buildEdges(REPO_ROOT, resolver, [{
    absolutePath: "/repo/app/features/f1/model/x.ts",
    source: 'import { z } from "some-package";\n',
  }]);
  assertEquals(edges, []);
});

Deno.test("edge: a file with no specifiers produces no edges", () => {
  const resolver = fakeResolver({});
  const edges = buildEdges(REPO_ROOT, resolver, [{
    absolutePath: "/repo/app/features/f1/model/x.ts",
    source: "export const x = 1;\n",
  }]);
  assertEquals(edges, []);
});

Deno.test("edge: multiple files each contribute their own edges", () => {
  const resolver = fakeResolver({
    "./a.ts": "/repo/app/features/f1/model/a.ts",
    "./b.ts": "/repo/app/features/f1/model/b.ts",
  });
  const edges = buildEdges(REPO_ROOT, resolver, [
    {
      absolutePath: "/repo/app/features/f1/model/x.ts",
      source: 'import { a } from "./a.ts";\n',
    },
    {
      absolutePath: "/repo/app/features/f1/model/y.ts",
      source: 'import { b } from "./b.ts";\n',
    },
  ]);
  assertEquals(edges.length, 2);
});
