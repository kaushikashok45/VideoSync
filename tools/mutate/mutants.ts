import type { Mutant, Site } from "../contracts/mutation";
import { comparisonFlipSites } from "./comparison-flip.ts";
import { conditionNegationSites } from "./condition-negation.ts";
import { guardRemovalSites } from "./guard-removal.ts";
import { numericOffByOneSites } from "./numeric-off-by-one.ts";
import { booleanSwapSites } from "./boolean-swap.ts";
import { droppedPropertySites } from "./dropped-property.ts";
import { arrayIndexShiftSites } from "./array-index-shift.ts";

type Operator = (source: string, filename: string) => readonly Site[];

/** All 7 operators the mutation harness is specified to run, in report order. */
const OPERATORS: readonly Operator[] = [
  comparisonFlipSites,
  conditionNegationSites,
  guardRemovalSites,
  numericOffByOneSites,
  booleanSwapSites,
  droppedPropertySites,
  arrayIndexShiftSites,
];

function replaceAt(source: string, site: Site): string {
  return source.slice(0, site.start) + site.replacement +
    source.slice(site.end);
}

function sitesFor(source: string, filename: string): Site[] {
  const sites: Site[] = [];
  for (const operator of OPERATORS) sites.push(...operator(source, filename));
  return sites.sort((left, right) => left.start - right.start);
}

/**
 * Every mutant the 7 spec-listed operators find in one file's source, one
 * mutation per mutant -- never combined, so a survivor's cause is always a
 * single site.
 */
export function generateMutants(
  source: string,
  filename: string,
): readonly Mutant[] {
  return sitesFor(source, filename).map((site) => ({
    description: site.description,
    source: replaceAt(source, site),
  }));
}
