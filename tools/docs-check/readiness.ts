import { parseSections } from "./markdown-sections.ts";
import { capabilityIds } from "./capability-ids.ts";

function capabilitiesPopulated(prd: string): boolean {
  const sections = parseSections(prd);
  const index = sections.findIndex((section) =>
    /^Capabilities$/i.test(section.heading)
  );
  if (index < 0) return false;
  const section = sections[index];
  if (capabilityIds(section.rawText).length > 0) return true;
  return sections
    .slice(index + 1)
    .some((later) =>
      later.level > section.level && /^CAP-\d+$/.test(later.heading)
    );
}

/**
 * `pipeline:check`'s highest-weight rule: a `**Status**: BLOCKED` readiness
 * scorecard may not carry a populated `## Capabilities` section — that is
 * the mechanism enforcing "no polished spec before the uncertainty is
 * resolved" (docs/PIPELINE.md).
 */
export function blockedReadinessHasCapabilities(prd: string): boolean {
  const readiness =
    parseSections(prd).find((section) => /^Readiness$/i.test(section.heading))
      ?.rawText ?? "";
  return /\*\*Status\*\*:\s*BLOCKED\b/i.test(readiness) &&
    capabilitiesPopulated(prd);
}
