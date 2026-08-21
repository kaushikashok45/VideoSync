import { assertEquals, assertMatch } from "@std/assert";
import { runPrecommit } from "./precommit.ts";

function captureError(run: () => number): { code: number; lines: string[] } {
  const lines: string[] = [];
  const original = console.error;
  console.error = (msg: string) => lines.push(msg);
  try {
    return { code: run(), lines };
  } finally {
    console.error = original;
  }
}

async function fixtureWithOneFormattedFile(): Promise<string> {
  const dir = await Deno.makeTempDir();
  await Deno.writeTextFile(`${dir}/ok.ts`, "export const x = 1;\n");
  return dir;
}

Deno.test("sad: a repo with no app/server dirs fails fast at the typecheck step", async () => {
  const dir = await fixtureWithOneFormattedFile();
  const { code, lines } = captureError(() => runPrecommit([], dir));
  assertEquals(code, 1);
  assertMatch(lines[0], /step "check" failed/);
  await Deno.remove(dir, { recursive: true });
});

Deno.test('edge: "--all" is accepted as a scope flag without crashing before the first step runs', async () => {
  const dir = await fixtureWithOneFormattedFile();
  const { code } = captureError(() => runPrecommit(["--all"], dir));
  assertEquals(code, 1);
  await Deno.remove(dir, { recursive: true });
});

Deno.test('edge: "--machine-only" changes nothing about which step fails', async () => {
  const dir = await fixtureWithOneFormattedFile();
  const { lines } = captureError(() => runPrecommit(["--machine-only"], dir));
  assertMatch(lines[0], /step "check" failed/);
  await Deno.remove(dir, { recursive: true });
});
