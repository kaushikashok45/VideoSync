import type { Section } from "../contracts/docs-check";

const HEADING = /^(#{1,6})[ \t]+(.+?)\s*$/;

function sectionOf(
  heading: string,
  level: number,
  lines: readonly string[],
): Section {
  return { heading, level, rawText: lines.join("\n") };
}

export function parseSections(markdown: string): readonly Section[] {
  const sections: Section[] = [];
  let current: { heading: string; level: number; lines: string[] } | null =
    null;
  const flush = () => {
    if (current !== null) {
      sections.push(sectionOf(current.heading, current.level, current.lines));
    }
  };
  for (const line of markdown.split(/\r?\n/)) {
    const match = HEADING.exec(line);
    if (match === null) {
      current?.lines.push(line);
      continue;
    }
    flush();
    current = { heading: match[2], level: match[1].length, lines: [] };
  }
  flush();
  return sections;
}
