/**
 * Every distinct `CAP-<n>` id mentioned in `text`, in first-appearance order.
 */
export function capabilityIds(text: string): readonly string[] {
  return [...new Set(text.match(/\bCAP-\d+\b/g) ?? [])];
}
