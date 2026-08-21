import type { CapabilityTraceContext } from "../contracts/docs-check";
import { phaseForCapability } from "./capability-phase.ts";

function phaseFailures(
  context: CapabilityTraceContext,
  id: string,
  phase: number | null,
): readonly string[] {
  if (phase === null) return [`${id} has no **Phase**`];
  const count =
    (context.deliveryText.match(new RegExp(`\\b${id}\\b`, "g")) ?? [])
      .length;
  return count === 1
    ? []
    : [`${id} is not accounted for exactly once in Delivery phases`];
}

function activePhaseFailures(
  context: CapabilityTraceContext,
  id: string,
  phase: number | null,
): readonly string[] {
  if (phase !== context.activePhase) return [];
  if (!context.spec.includes(id)) {
    return [`active ${id} is absent from 04-spec.md`];
  }
  return /Deno\.test\("([^"]+)"/.test(context.spec)
    ? []
    : [`active ${id} has no literal Deno.test binding`];
}

/**
 * Traces one capability id through the design screen, the HLD slice, its
 * `**Phase**`, `## Delivery phases`, and — only for the active phase — a
 * literal `Deno.test` in `04-spec.md` (docs/PIPELINE.md).
 */
export function traceCapability(
  context: CapabilityTraceContext,
  id: string,
): readonly string[] {
  const failures: string[] = [];
  if (!context.design.includes(id)) {
    failures.push(`${id} is absent from 02a-design.md`);
  }
  if (!context.hld.includes(id)) {
    failures.push(`${id} is absent from 03-hld.md`);
  }
  const phase = phaseForCapability(context.prd, id);
  return [
    ...failures,
    ...phaseFailures(context, id, phase),
    ...activePhaseFailures(context, id, phase),
  ];
}
