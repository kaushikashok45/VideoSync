import { loadSuppressor } from "./shared/suppress.ts";
import { createResolver } from "./shared/specifier-resolve.ts";
import { createProbes } from "./shared/fs-probes.ts";
import { createBoundaryRuleKit } from "./shared/boundary-rule-kit.ts";
import { addedFilesFor } from "./shared/added-files.ts";
import { createLayerOrderRule } from "./shared/layer-order-rule.ts";
import { createCrossSliceSameLayerRule } from "./shared/cross-slice-same-layer-rule.ts";
import { createDeepImportRule } from "./shared/deep-import-rule.ts";
import { createSliceFactRule } from "./shared/slice-fact-rule.ts";
import { createNoDumpingGroundRule } from "./shared/no-dumping-ground-rule.ts";
import { createContractFirstRule } from "./shared/contract-first-rule.ts";
import { createPublicSurfaceCapRule } from "./shared/public-surface-cap-rule.ts";
import { createSliceFanOutCapRule } from "./shared/slice-fan-out-cap-rule.ts";
import { createNoStarExportRule } from "./shared/no-star-export-rule.ts";
import { readEdgesJsonl } from "../graph/read-edges.ts";
import { sliceEdgesFrom } from "../graph/slice-graph.ts";
import { fanOutCounts } from "../graph/fan-out.ts";
import type { Suppressor } from "../contracts/suppress";
import type { SliceProbe } from "../contracts/fs-probes";

const MISSING_INDEX = {
  ruleId: "boundary/missing-index",
  isMissing: (probe: SliceProbe) => !probe.hasIndex,
  message: "Slice has no index.ts public entry.",
};

const MISSING_CONTRACT = {
  ruleId: "boundary/missing-contract",
  isMissing: (probe: SliceProbe) => !probe.hasContract,
  message: "Slice has no contracts/ directory.",
};

interface Collaborators {
  readonly kit: ReturnType<typeof createBoundaryRuleKit>;
  readonly resolver: ReturnType<typeof createResolver>;
  readonly probes: ReturnType<typeof createProbes>;
  readonly suppressor: Suppressor;
  readonly repoRoot: string;
  readonly addedFiles: ReadonlySet<string>;
  readonly fanOutBySlice: ReadonlyMap<string, number>;
}

/** Reads `edges.jsonl` and reduces it to fan-out counts, once per plugin build. */
function loadFanOutBySlice(repoRoot: string): ReadonlyMap<string, number> {
  const edges = readEdgesJsonl(`${repoRoot}/tools/graph/edges.jsonl`);
  return fanOutCounts(sliceEdgesFrom(edges));
}

function buildLayerRules(
  collaborators: Collaborators,
): Record<string, Deno.lint.Rule> {
  const { kit, resolver, suppressor } = collaborators;
  return {
    "layer-order": createLayerOrderRule(kit, resolver, suppressor),
    "cross-slice-same-layer": createCrossSliceSameLayerRule(
      kit,
      resolver,
      suppressor,
    ),
    "deep-import": createDeepImportRule(kit, resolver, suppressor),
  };
}

/** The two `createSliceFactRule` entries -- split out of `buildSliceRules` so that function's body stays within the structural line budget. */
function buildMissingFactRules(
  kit: Collaborators["kit"],
  probes: Collaborators["probes"],
  suppressor: Suppressor,
): Record<string, Deno.lint.Rule> {
  return {
    "missing-index": createSliceFactRule(
      kit,
      probes,
      suppressor,
      MISSING_INDEX,
    ),
    "missing-contract": createSliceFactRule(
      kit,
      probes,
      suppressor,
      MISSING_CONTRACT,
    ),
  };
}

function buildSliceRules(
  collaborators: Collaborators,
): Record<string, Deno.lint.Rule> {
  const { kit, probes, suppressor, repoRoot, addedFiles } = collaborators;
  return {
    ...buildMissingFactRules(kit, probes, suppressor),
    "no-dumping-ground": createNoDumpingGroundRule(kit, suppressor),
    "no-star-export": createNoStarExportRule(kit, suppressor),
    "contract-first": createContractFirstRule(kit, probes, suppressor, {
      repoRoot,
      addedFiles,
    }),
  };
}

function buildGraphRules(
  collaborators: Collaborators,
): Record<string, Deno.lint.Rule> {
  const { kit, suppressor, probes, fanOutBySlice } = collaborators;
  return {
    "public-surface-cap": createPublicSurfaceCapRule(kit, suppressor),
    "slice-fan-out-cap": createSliceFanOutCapRule(
      kit,
      suppressor,
      probes,
      fanOutBySlice,
    ),
  };
}

function buildRules(
  collaborators: Collaborators,
): Record<string, Deno.lint.Rule> {
  return {
    ...buildLayerRules(collaborators),
    ...buildSliceRules(collaborators),
    ...buildGraphRules(collaborators),
  };
}

/**
 * The FSD boundary checker: layer direction (ARCH-001), cross-slice access
 * only through a slice's public entry (ARCH-007), the "no helpers" filename
 * dumping-ground ban, and contract-first slice shape. Not registered in
 * `deno.json` until commit 7 [why](docs/DECISIONS.md#ad-010); exercised only via
 * `Deno.lint.runPlugin` until then.
 */
export function createBoundaryPlugin(repoRoot: string): Deno.lint.Plugin {
  const collaborators: Collaborators = {
    suppressor: loadSuppressor(
      `${repoRoot}/tools/baseline/baseline.json`,
    ),
    resolver: createResolver(`${repoRoot}/deno.json`),
    probes: createProbes(),
    addedFiles: addedFilesFor(repoRoot),
    kit: createBoundaryRuleKit(repoRoot),
    repoRoot,
    fanOutBySlice: loadFanOutBySlice(repoRoot),
  };
  return { name: "boundary", rules: buildRules(collaborators) };
}
