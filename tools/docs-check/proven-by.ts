import type { ProvenBy } from "../contracts/docs-check";

const BOUND = /Proven by:\s*`([^`]+)`\s*::\s*`?"([^"]+)"`?/;

function siblingTests(itemText: string): readonly string[] {
  return [...itemText.matchAll(/Also proven by:\s*"([^"]+)"/g)].map(
    (match) => match[1],
  );
}

/**
 * Classifies the `Proven by:` clause of one wrap-joined invariant item into
 * exactly one of `pending`, `bound`, or `malformed`. `malformed` is a
 * first-class outcome (a template literal, a bare identifier, an object
 * form) rather than being silently treated as `bound` or dropped — a
 * checker that cannot see a literal test name must not report success.
 */
export function parseProvenBy(itemText: string): ProvenBy {
  const match = /Proven by:\s*(.*)$/.exec(itemText);
  if (match === null) return { kind: "malformed", raw: "" };
  const raw = match[1].trim();
  if (/^PENDING\s+—/.test(raw)) return { kind: "pending" };
  const first = BOUND.exec(itemText);
  if (first === null) return { kind: "malformed", raw };
  return {
    kind: "bound",
    file: first[1],
    tests: [first[2], ...siblingTests(itemText)],
  };
}
