import type { RegenOptions } from "../contracts/baseline-generate";

function reasonAfter(args: readonly string[], index: number): string | null {
  return index >= 0 && index + 1 < args.length ? args[index + 1] : null;
}

/** Parses `--allow-increase --reason "..."` from CLI args; both flags are independent. */
export function parseRegenOptions(args: readonly string[]): RegenOptions {
  const reasonIndex = args.indexOf("--reason");
  return {
    allowIncrease: args.includes("--allow-increase"),
    reason: reasonAfter(args, reasonIndex),
  };
}
