import { createBoundaryRuleKit } from "./boundary-rule-kit.ts";
import type { Suppressor } from "../../contracts/suppress";
import type { SliceProbe } from "../../contracts/fs-probes";

type Kit = ReturnType<typeof createBoundaryRuleKit>;

interface Probes {
  probe(sliceRoot: string): SliceProbe;
  claimReport(sliceRoot: string, ruleId: string): boolean;
}

interface SliceFactOptions {
  readonly ruleId: string;
  readonly isMissing: (probe: SliceProbe) => boolean;
  readonly message: string;
}

/**
 * FLOW.md Step 7: a property of a whole slice, probed once per slice and
 * reported at most once via the `claimReport` latch, anchored at the first
 * offending file's `Program` node [why](docs/DECISIONS.md#ad-009). Shared by
 * `missing-index` and `missing-contract`.
 */
export function createSliceFactRule(
  kit: Kit,
  probes: Probes,
  suppressor: Suppressor,
  options: SliceFactOptions,
): Deno.lint.Rule {
  return {
    create(context) {
      return kit.forKnownFiles(context, (fsd) => ({
        Program(node) {
          if (fsd.sliceRoot === null) return;
          if (!probes.claimReport(fsd.sliceRoot, options.ruleId)) return;
          if (!options.isMissing(probes.probe(fsd.sliceRoot))) return;
          kit.reportForSlice({
            context,
            suppressor,
            ruleId: options.ruleId,
            sliceRoot: fsd.sliceRoot,
            node,
            message: options.message,
          });
        },
      }));
    },
  };
}
