import { assertEquals } from "@std/assert";
import { readEdgesJsonl } from "./read-edges.ts";

function withTempFile(content: string, run: (path: string) => void): void {
  const dir = Deno.makeTempDirSync();
  const path = `${dir}/edges.jsonl`;
  Deno.writeTextFileSync(path, content);
  try {
    run(path);
  } finally {
    Deno.removeSync(dir, { recursive: true });
  }
}

Deno.test("happy: reads every valid edge line", () => {
  withTempFile(
    '{"from":"a.ts","to":"b.ts","fromSlice":"s1","toSlice":"s2"}\n',
    (path) => {
      assertEquals(readEdgesJsonl(path), [
        { from: "a.ts", to: "b.ts", fromSlice: "s1", toSlice: "s2" },
      ]);
    },
  );
});

Deno.test("sad: a missing file degrades to an empty graph (fails open)", () => {
  assertEquals(readEdgesJsonl("/no/such/path/edges.jsonl"), []);
});

Deno.test("edge: a malformed line is skipped without throwing", () => {
  withTempFile(
    "not json\n" +
      '{"from":"a.ts","to":"b.ts","fromSlice":null,"toSlice":null}\n',
    (path) => {
      assertEquals(readEdgesJsonl(path), [
        { from: "a.ts", to: "b.ts", fromSlice: null, toSlice: null },
      ]);
    },
  );
});

Deno.test("edge: a blank trailing line contributes nothing", () => {
  withTempFile('{"from":"a.ts","to":"b.ts"}\n\n', (path) => {
    assertEquals(readEdgesJsonl(path).length, 1);
  });
});
