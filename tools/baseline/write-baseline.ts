import type { PersistedBaseline } from "../contracts/baseline-generate";

/** Writes the committed ratchet baseline as pretty JSON, newline-terminated. */
export function writeBaselineFile(
  path: string,
  baseline: PersistedBaseline,
): void {
  Deno.writeTextFileSync(path, JSON.stringify(baseline, null, 2) + "\n");
}
