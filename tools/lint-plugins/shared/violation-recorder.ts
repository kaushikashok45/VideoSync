/**
 * A process-wide recording slot for every (path, identity, ruleId) triple
 * `reportViolation` computes, regardless of whether the suppressor would
 * hide it. Set only by the baseline generator around a scan and read by
 * `report-violation.ts`; a plain mutable slot rather than a public
 * setter/getter pair, so this module keeps exactly one public export while
 * both sides close over the same reference. `null` (the default) means no
 * generator is running, so ordinary lint runs pay nothing for this.
 */
export const activeViolationRecorder: {
  current:
    | ((path: string, identity: string, ruleId: string) => void)
    | null;
} = { current: null };
