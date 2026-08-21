import { assertEquals } from "@std/assert";
import { printCycles } from "./print-cycles.ts";

function withEdgesFile(content: string, run: (path: string) => void): void {
  const dir = Deno.makeTempDirSync();
  const path = `${dir}/edges.jsonl`;
  Deno.writeTextFileSync(path, content);
  try {
    run(path);
  } finally {
    Deno.removeSync(dir, { recursive: true });
  }
}

function captureLogs(run: () => number): { code: number; lines: string[] } {
  const lines: string[] = [];
  const original = console.log;
  console.log = (msg: string) => lines.push(msg);
  try {
    return { code: run(), lines };
  } finally {
    console.log = original;
  }
}

Deno.test("happy: a cyclic edge set prints its formatted cycle", () => {
  withEdgesFile(
    '{"from":"a.ts","to":"b.ts","fromSlice":"s1","toSlice":"s2"}\n' +
      '{"from":"b.ts","to":"a.ts","fromSlice":"s2","toSlice":"s1"}\n',
    (path) => {
      const { code, lines } = captureLogs(() => printCycles(path));
      assertEquals(code, 0);
      assertEquals(lines, ["s1 -> s2 -> s1"]);
    },
  );
});

Deno.test("sad: an acyclic edge set reports no cycles found", () => {
  withEdgesFile(
    '{"from":"a.ts","to":"b.ts","fromSlice":"s1","toSlice":"s2"}\n',
    (path) => {
      const { code, lines } = captureLogs(() => printCycles(path));
      assertEquals(code, 0);
      assertEquals(lines, ["no cycles found"]);
    },
  );
});

Deno.test("edge: a missing edges.jsonl degrades to no cycles found, not a crash", () => {
  const { code, lines } = captureLogs(() => printCycles("/no/such/file.jsonl"));
  assertEquals(code, 0);
  assertEquals(lines, ["no cycles found"]);
});
