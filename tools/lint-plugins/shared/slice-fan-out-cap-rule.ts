import { sliceKeyOf } from "../../graph/slice-key.ts";
import type { createBoundaryRuleKit } from "./boundary-rule-kit.ts";
import type { Suppressor } from "../../contracts/suppress";
import type { FsdPath } from "../../contracts/fsd-path";

type Kit = ReturnType<typeof createBoundaryRuleKit>;

interface Probes {
  claimReport(sliceRoot: string, ruleId: string): boolean;
}

const RULE_ID = "boundary/slice-fan-out-cap";
const MAX_SLICE_FAN_OUT = 3;

function messageFor(count: number): string {
  return `Slice imports ${count} other slices, exceeding the cap of ` +
    `${MAX_SLICE_FAN_OUT}.`;
}

function fanOutFor(
  fanOutBySlice: ReadonlyMap<string, number>,
  fsd: FsdPath,
): number {
  const key = sliceKeyOf(fsd);
  return key === null ? 0 : fanOutBySlice.get(key) ?? 0;
}

/**
 * A per-slice fact from `edges.jsonl` via `fan-out.ts`, reported at most
 * once per slice through the same `probes.claimReport` latch
 * `missing-index`/`missing-contract` use -- cross-file knowledge a
 * single-file AST pass cannot see on its own, so it is computed once at
 * plugin construction and only looked up here.
 */
export function createSliceFanOutCapRule(
  kit: Kit,
  suppressor: Suppressor,
  probes: Probes,
  fanOutBySlice: ReadonlyMap<string, number>,
): Deno.lint.Rule {
  return {
    create(context) {
      return kit.forKnownFiles(context, (fsd) => ({
        Program(node) {
          if (fsd.sliceRoot === null) return;
          if (!probes.claimReport(fsd.sliceRoot, RULE_ID)) return;
          const count = fanOutFor(fanOutBySlice, fsd);
          if (count <= MAX_SLICE_FAN_OUT) return;
          kit.reportForSlice({
            context,
            suppressor,
            ruleId: RULE_ID,
            sliceRoot: fsd.sliceRoot,
            node,
            message: messageFor(count),
          });
        },
      }));
    },
  };
}
