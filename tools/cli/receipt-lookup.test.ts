import { assertEquals } from "@std/assert";
import { hasClearReceipt } from "./receipt-lookup.ts";

const RECEIPT_DIRS = [
  ".claude/review-receipts",
  ".agents/review-receipts",
  ".opencode/review-receipts",
];

async function fixtureDir(): Promise<string> {
  return await Deno.makeTempDir();
}

async function writeReceipt(
  root: string,
  dir: string,
  key: string,
  body: unknown,
): Promise<void> {
  const full = `${root}/${dir}`;
  await Deno.mkdir(full, { recursive: true });
  await Deno.writeTextFile(`${full}/${key}.json`, JSON.stringify(body));
}

Deno.test("happy: a CLEAR receipt in any of the three directories is accepted", async () => {
  for (const dir of RECEIPT_DIRS) {
    const root = await fixtureDir();
    await writeReceipt(root, dir, "abc123", {
      key: "abc123",
      verdict: "CLEAR",
    });
    assertEquals(hasClearReceipt(root, "abc123"), true);
    await Deno.remove(root, { recursive: true });
  }
});

Deno.test("sad: no receipt anywhere blocks", async () => {
  const root = await fixtureDir();
  assertEquals(hasClearReceipt(root, "missing"), false);
  await Deno.remove(root, { recursive: true });
});

Deno.test("sad: a BLOCKING verdict is not accepted", async () => {
  const root = await fixtureDir();
  await writeReceipt(root, RECEIPT_DIRS[0], "key1", {
    key: "key1",
    verdict: "BLOCKED",
  });
  assertEquals(hasClearReceipt(root, "key1"), false);
  await Deno.remove(root, { recursive: true });
});

Deno.test("edge: malformed JSON is treated as no receipt, not a thrown error", async () => {
  const root = await fixtureDir();
  const dir = `${root}/${RECEIPT_DIRS[0]}`;
  await Deno.mkdir(dir, { recursive: true });
  await Deno.writeTextFile(`${dir}/key2.json`, "{not json");
  assertEquals(hasClearReceipt(root, "key2"), false);
  await Deno.remove(root, { recursive: true });
});

Deno.test("edge: a receipt for a different key does not match", async () => {
  const root = await fixtureDir();
  await writeReceipt(root, RECEIPT_DIRS[0], "keyA", {
    key: "keyA",
    verdict: "CLEAR",
  });
  assertEquals(hasClearReceipt(root, "keyB"), false);
  await Deno.remove(root, { recursive: true });
});
