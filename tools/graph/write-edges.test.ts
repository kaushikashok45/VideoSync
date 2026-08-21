import { assertEquals } from "@std/assert";
import { writeEdgesJsonl } from "./write-edges.ts";

function withTempFile(run: (path: string) => void): void {
  const dir = Deno.makeTempDirSync();
  try {
    run(`${dir}/edges.jsonl`);
  } finally {
    Deno.removeSync(dir, { recursive: true });
  }
}

Deno.test("happy: one edge per line as JSON", () => {
  withTempFile((path) => {
    writeEdgesJsonl(path, [
      { from: "a.ts", to: "b.ts", fromSlice: "s1", toSlice: "s2" },
      { from: "c.ts", to: "d.ts", fromSlice: null, toSlice: null },
    ]);
    const lines = Deno.readTextFileSync(path).trim().split("\n");
    assertEquals(lines.length, 2);
    assertEquals(JSON.parse(lines[0]).from, "a.ts");
    assertEquals(JSON.parse(lines[1]).to, "d.ts");
  });
});

Deno.test("edge: an empty edge list writes an empty file", () => {
  withTempFile((path) => {
    writeEdgesJsonl(path, []);
    assertEquals(Deno.readTextFileSync(path), "");
  });
});
