import type { ReviewReceipt } from "../contracts/receipt";
import { ignoreExpectedFailure } from "../lint-plugins/shared/ignore-expected-failure.ts";

/**
 * AD-015 (`docs/DECISIONS.md#ad-015`): all three agent-adapter directories
 * are checked, none is canonical, and none is written or restructured here.
 */
const RECEIPT_DIRS = [
  ".claude/review-receipts",
  ".agents/review-receipts",
  ".opencode/review-receipts",
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function parseReceipt(text: string): ReviewReceipt | null {
  try {
    const parsed: unknown = JSON.parse(text);
    if (!isRecord(parsed)) return null;
    const verdict = parsed.verdict;
    return typeof verdict === "string" ? { key: "", verdict } : null;
  } catch (error) {
    ignoreExpectedFailure(error);
    return null;
  }
}

function readReceipt(path: string): ReviewReceipt | null {
  try {
    return parseReceipt(Deno.readTextFileSync(path));
  } catch (error) {
    ignoreExpectedFailure(error);
    return null;
  }
}

/**
 * `true` when `<receiptKey>.json` exists, with `verdict === "CLEAR"`, in at
 * least one of the three review-receipt directories. A missing file, an
 * unreadable file, or malformed JSON in a given directory is treated the
 * same as "no receipt there" -- this must stay a pure boolean, never a
 * thrown error, since the pre-commit hook's fast-block path depends on it.
 */
export function hasClearReceipt(
  repoRoot: string,
  receiptKey: string,
): boolean {
  return RECEIPT_DIRS.some((dir) =>
    readReceipt(`${repoRoot}/${dir}/${receiptKey}.json`)?.verdict === "CLEAR"
  );
}
