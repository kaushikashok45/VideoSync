import type { FeatureFiles } from "../contracts/docs-check";

const STAGE_ORDER: readonly (readonly [string, string])[] = [
  ["01-prd.md", "00-brief.md"],
  ["02a-design.md", "01-prd.md"],
  ["02b-motion.md", "01-prd.md"],
  ["02c-critique.md", "01-prd.md"],
  ["03-hld.md", "01-prd.md"],
  ["04-spec.md", "03-hld.md"],
];

function isApproved(files: FeatureFiles, path: string): boolean {
  return files.get(path)?.match(/\*\*Approved\*\*:\s*yes\b/i) !== null;
}

function verdictFailures(slug: string, files: FeatureFiles): readonly string[] {
  const prefix = `docs/features/${slug}/`;
  const brief = files.get(`${prefix}00-brief.md`);
  const prd = files.get(`${prefix}01-prd.md`);
  if (prd === undefined) return [];
  if (brief === undefined) {
    return [`${slug}: 01-prd.md exists without 00-brief.md`];
  }
  const hasVerdict = /\*\*Verdict\*\*:\s*(PROCEED|ENHANCE)\b/i.test(brief);
  return hasVerdict ? [] : [`${slug}: brief verdict is not PROCEED or ENHANCE`];
}

function approvalFailures(
  slug: string,
  files: FeatureFiles,
): readonly string[] {
  const prefix = `docs/features/${slug}/`;
  return STAGE_ORDER
    .filter(([artifact, predecessor]) =>
      files.has(`${prefix}${artifact}`) &&
      !isApproved(files, `${prefix}${predecessor}`)
    )
    .map(([artifact, predecessor]) =>
      `${slug}: ${artifact} requires **Approved**: yes in ${predecessor}`
    );
}

/**
 * `00-brief.md` before `01-prd.md`, a resolved verdict, and every later
 * artifact's predecessor carrying `**Approved**: yes` (docs/PIPELINE.md).
 */
export function stageOrderFailures(
  slug: string,
  files: FeatureFiles,
): readonly string[] {
  return [...verdictFailures(slug, files), ...approvalFailures(slug, files)];
}
