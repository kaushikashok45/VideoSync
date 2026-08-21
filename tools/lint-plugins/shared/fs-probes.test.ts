import { assert, assertEquals, assertFalse } from "@std/assert";
import { createProbes } from "./fs-probes.ts";

async function tempSlice(files: Record<string, string>): Promise<string> {
  const dir = await Deno.makeTempDir();
  for (const [name, content] of Object.entries(files)) {
    const full = `${dir}/${name}`;
    await Deno.mkdir(full.slice(0, full.lastIndexOf("/")), { recursive: true });
    await Deno.writeTextFile(full, content);
  }
  return dir;
}

Deno.test("happy: a well-formed slice reports index, contract, and export count", async () => {
  const dir = await tempSlice({
    "index.ts": "export const foo = 1;\nexport function bar() {}\n",
    "contracts/thing.d.ts": "export = {};\n",
  });
  const probes = createProbes();
  const result = probes.probe(dir);
  assert(result.hasIndex);
  assert(result.hasContract);
  assertEquals(result.publicExportCount, 2);
  await Deno.remove(dir, { recursive: true });
});

Deno.test("sad: a slice missing index.ts reports hasIndex false and count -1", async () => {
  const dir = await tempSlice({ "model/store.ts": "export const x = 1;\n" });
  const probes = createProbes();
  const result = probes.probe(dir);
  assertFalse(result.hasIndex);
  assertEquals(result.publicExportCount, -1);
  await Deno.remove(dir, { recursive: true });
});

Deno.test("edge: a slice missing a contracts directory reports hasContract false", async () => {
  const dir = await tempSlice({ "index.ts": "export const x = 1;\n" });
  const probes = createProbes();
  const result = probes.probe(dir);
  assertFalse(result.hasContract);
  await Deno.remove(dir, { recursive: true });
});

Deno.test("edge: an index.ts with zero exports reports count zero, not -1", async () => {
  const dir = await tempSlice({ "index.ts": "const internal = 1;\n" });
  const probes = createProbes();
  const result = probes.probe(dir);
  assert(result.hasIndex);
  assertEquals(result.publicExportCount, 0);
  await Deno.remove(dir, { recursive: true });
});

Deno.test("edge: a named export list counts each exported name", async () => {
  const dir = await tempSlice({
    "index.ts": "const a = 1;\nconst b = 2;\nexport { a, b };\n",
  });
  const probes = createProbes();
  const result = probes.probe(dir);
  assertEquals(result.publicExportCount, 2);
  await Deno.remove(dir, { recursive: true });
});

Deno.test("edge: index.tsx satisfies hasIndex when index.ts is absent", async () => {
  const dir = await tempSlice({
    "index.tsx": "export const Foo = () => null;\n",
  });
  const probes = createProbes();
  const result = probes.probe(dir);
  assert(result.hasIndex);
  assertEquals(result.publicExportCount, 1);
  await Deno.remove(dir, { recursive: true });
});

Deno.test("mutation: probe results are memoized per sliceRoot for the process lifetime", async () => {
  const dir = await tempSlice({ "index.ts": "export const a = 1;\n" });
  const probes = createProbes();
  const first = probes.probe(dir);
  await Deno.writeTextFile(
    `${dir}/index.ts`,
    "export const a = 1;\nexport const b = 2;\n",
  );
  const second = probes.probe(dir);
  assertEquals(
    second.publicExportCount,
    first.publicExportCount,
    "memoized probe must not re-read the filesystem",
  );
  await Deno.remove(dir, { recursive: true });
});

Deno.test("mutation: claimReport returns true exactly once per (slice, rule)", async () => {
  const dir = await tempSlice({ "index.ts": "export const a = 1;\n" });
  const probes = createProbes();
  assert(probes.claimReport(dir, "boundary/missing-index"));
  assertFalse(probes.claimReport(dir, "boundary/missing-index"));
  await Deno.remove(dir, { recursive: true });
});

Deno.test("mutation: claimReport is independent per rule for the same slice", async () => {
  const dir = await tempSlice({ "index.ts": "export const a = 1;\n" });
  const probes = createProbes();
  assert(probes.claimReport(dir, "boundary/missing-index"));
  assert(probes.claimReport(dir, "boundary/missing-contract"));
  await Deno.remove(dir, { recursive: true });
});

Deno.test("mutation: claimReport is independent per slice for the same rule", async () => {
  const dirA = await tempSlice({ "index.ts": "export const a = 1;\n" });
  const dirB = await tempSlice({ "index.ts": "export const a = 1;\n" });
  const probes = createProbes();
  assert(probes.claimReport(dirA, "boundary/missing-index"));
  assert(probes.claimReport(dirB, "boundary/missing-index"));
  await Deno.remove(dirA, { recursive: true });
  await Deno.remove(dirB, { recursive: true });
});

Deno.test("logical-limits: publicExportCount is exactly -1 only when hasIndex is false", async () => {
  const withIndex = await tempSlice({ "index.ts": "\n" });
  const withoutIndex = await tempSlice({
    "model/x.ts": "export const a = 1;\n",
  });
  const probes = createProbes();
  const withIndexResult = probes.probe(withIndex);
  const withoutIndexResult = probes.probe(withoutIndex);
  assert(withIndexResult.publicExportCount >= 0);
  assertEquals(withoutIndexResult.publicExportCount, -1);
  await Deno.remove(withIndex, { recursive: true });
  await Deno.remove(withoutIndex, { recursive: true });
});
