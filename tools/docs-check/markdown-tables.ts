function isSeparatorRow(line: string): boolean {
  return /^\|[\s-:|]+\|$/.test(line);
}

function cellsOf(line: string): readonly string[] {
  return line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((
    cell,
  ) => cell.trim());
}

/**
 * Parses the first pipe-table found in `sectionText` into data rows (header
 * and separator rows dropped), each row an array of trimmed cell strings.
 */
export function tableRows(sectionText: string): readonly (readonly string[])[] {
  const tableLines = sectionText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|") && !isSeparatorRow(line));
  return tableLines.slice(1).map(cellsOf);
}
