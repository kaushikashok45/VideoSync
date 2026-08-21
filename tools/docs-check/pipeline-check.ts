import type {
  CapabilityTraceContext,
  FeatureFiles,
} from "../contracts/docs-check";
import { capabilityIds } from "./capability-ids.ts";
import { blockedReadinessHasCapabilities } from "./readiness.ts";
import { stageOrderFailures } from "./artifact-order.ts";
import { traceCapability } from "./capability-trace.ts";
import { deliveryPhaseSection } from "./delivery-phase-section.ts";
import { readFeatureFiles } from "./feature-files.ts";

function textOr(files: FeatureFiles, path: string, fallback: string): string {
  return files.get(path) ?? fallback;
}

function deliveryText(prd: string): string {
  return deliveryPhaseSection(prd)?.rawText ?? "";
}

function activePhaseNumber(prd: string): number {
  return Number(/\*\*Active phase\*\*:\s*(\d+)/i.exec(prd)?.[1] ?? "1");
}

function buildContext(
  slug: string,
  files: FeatureFiles,
): CapabilityTraceContext | null {
  const path = (name: string) => `docs/features/${slug}/${name}`;
  const prd = files.get(path("01-prd.md"));
  if (prd === undefined) return null;
  return {
    prd,
    design: textOr(files, path("02a-design.md"), ""),
    hld: textOr(files, path("03-hld.md"), ""),
    spec: textOr(files, path("04-spec.md"), ""),
    activePhase: activePhaseNumber(prd),
    deliveryText: deliveryText(prd),
  };
}

function capabilityFailures(
  slug: string,
  context: CapabilityTraceContext,
): readonly string[] {
  return capabilityIds(context.prd).flatMap((id) =>
    traceCapability(context, id).map((failure) => `${slug}: ${failure}`)
  );
}

/**
 * Validates one feature slug's artifacts against docs/PIPELINE.md: stage
 * ordering, the readiness-scorecard gate, and per-capability tracing.
 * Called with an empty `files` map, or a slug with no artifacts at all,
 * this returns `[]` — the empty-set case is not a malformed one.
 */
export function checkPipelineArtifacts(
  slug: string,
  files: FeatureFiles = new Map(),
): readonly string[] {
  if (slug.length === 0) return [];
  const order = stageOrderFailures(slug, files);
  const context = buildContext(slug, files);
  if (context === null) return order;
  const blocked = blockedReadinessHasCapabilities(context.prd)
    ? [`${slug}: BLOCKED readiness has populated capabilities`]
    : [];
  return [...order, ...blocked, ...capabilityFailures(slug, context)];
}

function writeLine(message: string): void {
  Deno.stdout.writeSync(new TextEncoder().encode(`${message}\n`));
}

function listFeatureSlugs(root: string): readonly string[] | null {
  try {
    return [...Deno.readDirSync(root)]
      .filter((entry) => entry.isDirectory)
      .map((entry) => entry.name);
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return null;
    throw error;
  }
}

function runPipelineCheck(repoRoot = Deno.cwd()): number {
  const slugs = listFeatureSlugs(`${repoRoot}/docs/features`);
  if (slugs === null) {
    writeLine("pipeline:check: no pipeline artifacts yet");
    return 0;
  }
  const failures = slugs.flatMap((slug) =>
    checkPipelineArtifacts(slug, readFeatureFiles(repoRoot, slug))
  );
  failures.forEach((failure) => writeLine(`PIPELINE: ${failure}`));
  return failures.length === 0 ? 0 : 1;
}

if (import.meta.main) Deno.exit(runPipelineCheck());
