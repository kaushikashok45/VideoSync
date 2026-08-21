import { violationIdentity } from "../../baseline/identity.ts";
import { activeViolationRecorder } from "./violation-recorder.ts";
import type { Suppressor } from "../../contracts/suppress";
import type { ViolationSite } from "../../contracts/identity";

interface ReportingContext {
  readonly filename: string;
  report(data: { range: Deno.lint.Range; message: string }): void;
}

interface ReportViolationParams {
  readonly context: ReportingContext;
  readonly suppressor: Suppressor;
  readonly repoRoot: string;
  readonly site: ViolationSite;
  /**
   * Accepted as readonly because an AST node's `range` is `readonly [number, number]`
   * while `Deno.lint.Range` is mutable. Widening here means every caller can pass
   * `node.range` directly instead of each one copying or casting it.
   */
  readonly range: readonly [number, number];
  readonly message: string;
}

/** Strips `repoRoot` from an absolute path so it matches the baseline's repo-relative path set. */
function repoRelative(absolutePath: string, repoRoot: string): string {
  return absolutePath.startsWith(repoRoot)
    ? absolutePath.slice(repoRoot.length).replace(/^\/+/, "")
    : absolutePath;
}

/**
 * The FLOW.md Step 6 sequence, shared so every plugin gates identically:
 * build the identity, check the suppressor against the repo-relative path,
 * and report only when it is not already known. Order is load-bearing --
 * `classify()`/callers use an absolute path while `isKnown()` needs a
 * repo-relative one, and this is the one place that conversion happens.
 */
export function reportViolation(params: ReportViolationParams): void {
  const id = violationIdentity(params.site);
  const path = repoRelative(params.context.filename, params.repoRoot);
  // Fires for every candidate violation, suppressed or not, so the baseline
  // generator sees true current counts even when a prior baseline is
  // already loaded [why](docs/DECISIONS.md#ad-005).
  activeViolationRecorder.current?.(path, id, params.site.ruleId);
  if (params.suppressor.isKnown(path, id)) return;
  // Copy into a mutable tuple: `context.report` wants `Deno.lint.Range`, and a
  // copy is honest where a cast would only silence the checker.
  const [start, end] = params.range;
  params.context.report({ range: [start, end], message: params.message });
}
