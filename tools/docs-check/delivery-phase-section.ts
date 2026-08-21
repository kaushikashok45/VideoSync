import type { Section } from "../contracts/docs-check";
import { parseSections } from "./markdown-sections.ts";

/**
 * The `## Delivery phases` section of a PRD, or `undefined` if absent.
 */
export function deliveryPhaseSection(prd: string): Section | undefined {
  return parseSections(prd).find((section) =>
    /^Delivery phases$/i.test(section.heading)
  );
}
