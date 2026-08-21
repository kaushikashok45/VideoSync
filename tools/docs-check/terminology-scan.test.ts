import { assertEquals } from "@std/assert";
import { scanForTerms } from "./terminology-scan.ts";

function withFixture(
  files: Record<string, string>,
  run: (root: string) => void,
) {
  const root = Deno.makeTempDirSync();
  for (const [path, contents] of Object.entries(files)) {
    const fullPath = `${root}/${path}`;
    Deno.mkdirSync(fullPath.slice(0, fullPath.lastIndexOf("/")), {
      recursive: true,
    });
    Deno.writeTextFileSync(fullPath, contents);
  }
  try {
    run(root);
  } finally {
    Deno.removeSync(root, { recursive: true });
  }
}

Deno.test("happy: counts a plain word once per occurrence", () => {
  withFixture(
    { "app/a.ts": "const x = media; const y = media;" },
    (root) => {
      const [count] = scanForTerms(root, ["media"]);
      assertEquals(count.totalCount, 2);
    },
  );
});

Deno.test("sad: a banned word inside a longer camelCase identifier is not counted", () => {
  withFixture(
    { "app/a.ts": "export interface MediaSource {}" },
    (root) => {
      const [count] = scanForTerms(root, ["media"]);
      assertEquals(count.totalCount, 0);
    },
  );
});

Deno.test("edge: a test file is excluded from the scan", () => {
  withFixture(
    { "app/a.test.ts": "const party = 1;" },
    (root) => {
      const [count] = scanForTerms(root, ["party"]);
      assertEquals(count.totalCount, 0);
    },
  );
});

Deno.test("logical-limits: a trailing '*' scans as a case-insensitive prefix", () => {
  withFixture(
    { "server/a.ts": "class RecieverPeerManager {}" },
    (root) => {
      const [count] = scanForTerms(root, ["Reciever*"]);
      assertEquals(count.totalCount, 1);
    },
  );
});
