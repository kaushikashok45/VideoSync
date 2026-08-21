interface Accumulator {
  readonly items: readonly string[];
  readonly current: readonly string[] | null;
}

function numberedStart(line: string): string | null {
  return /^(\d+)\.\s+(.*)$/.exec(line)?.[2]?.trim() ?? null;
}

function flushed(current: readonly string[] | null): string | null {
  if (current === null) return null;
  const joined = current.join(" ").trim();
  return joined.length > 0 ? joined : null;
}

function closeCurrent(accumulator: Accumulator): readonly string[] {
  const closed = flushed(accumulator.current);
  return closed === null ? accumulator.items : [...accumulator.items, closed];
}

function absorb(accumulator: Accumulator, line: string): Accumulator {
  const numbered = numberedStart(line);
  if (numbered !== null) {
    return { items: closeCurrent(accumulator), current: [numbered] };
  }
  const isBreak = accumulator.current === null || line.trim() === "";
  if (isBreak) return { items: closeCurrent(accumulator), current: null };
  return {
    items: accumulator.items,
    current: [...accumulator.current, line.trim()],
  };
}

/**
 * Extracts the numbered list following `afterMarker` in `rawText`, joining
 * continuation lines with a single space. This is the wrap-tolerance fix
 * (`deno fmt` reflows a `Proven by:` reference across several physical
 * lines): every regex downstream of this function sees one joined line per
 * list item, never the raw wrapped source.
 */
export function listItems(
  rawText: string,
  afterMarker: string,
): readonly string[] {
  const marker = rawText.indexOf(afterMarker);
  if (marker < 0) return [];
  const lines = rawText.slice(marker + afterMarker.length).split(/\r?\n/);
  const result = lines.reduce<Accumulator>(absorb, {
    items: [],
    current: null,
  });
  return closeCurrent(result);
}
