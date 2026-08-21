import type { KnownRoot, RootMatch } from "../../contracts/fsd-root";

function isAppOrServer(segment: string): boolean {
  return segment === "app" || segment === "server";
}

function precededByRootSwitch(
  segments: readonly string[],
  index: number,
): boolean {
  return index > 0 && isAppOrServer(segments[index - 1]);
}

function isContractsMarkerAt(
  segments: readonly string[],
  index: number,
): boolean {
  return segments[index] === "shared" &&
    segments[index + 1] === "contracts" &&
    !precededByRootSwitch(segments, index);
}

/**
 * `shared/contracts/` marks the contracts root only when it is not already
 * nested under `app/` or `server/` (those have their own `shared` layer).
 */
function findContractsMarker(segments: readonly string[]): number {
  for (let index = 0; index < segments.length - 1; index++) {
    if (isContractsMarkerAt(segments, index)) return index;
  }
  return -1;
}

/**
 * Locates the earliest known FSD root marker in an absolute path's segments.
 * Pure path segmentation: it knows the strings `app`/`server`/`tools`/
 * `contracts` and nothing about layers, slices, or roles
 * [why](docs/GOVERNANCE.md).
 */
export function findRoot(segments: readonly string[]): RootMatch | null {
  const candidates: Array<{ root: KnownRoot; idx: number; span: number }> = [
    { root: "app", idx: segments.indexOf("app"), span: 1 },
    { root: "server", idx: segments.indexOf("server"), span: 1 },
    { root: "tools", idx: segments.indexOf("tools"), span: 1 },
    { root: "contracts", idx: findContractsMarker(segments), span: 2 },
  ];
  const present = candidates.filter((candidate) => candidate.idx >= 0);
  if (present.length === 0) return null;
  const best = present.reduce((closest, candidate) =>
    candidate.idx < closest.idx ? candidate : closest
  );
  return { root: best.root, markerEnd: best.idx + best.span };
}
