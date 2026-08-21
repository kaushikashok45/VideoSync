import type { FsdPath, SliceRole } from "../../contracts/fsd-path";
import { findRoot } from "./fsd-root.ts";
import { roleOf } from "./fsd-role.ts";

/** Single source of the FSD layer chains — app/ and server/ read from here so they cannot drift. */
const LAYER_CHAINS: Readonly<Record<"app" | "server", readonly string[]>> = {
  app: ["shared", "entities", "features", "widgets", "pages", "app"],
  server: ["shared", "entities", "features", "app"],
};

/** The frozen pre-FSD legacy zone, verbatim from docs/GOVERNANCE.md. */
const LEGACY_TOP_LEVEL = new Set(["common", "context", "routes", "utils"]);
const LEGACY_FEATURES = new Set(
  ["videoPlayback", "webRTC", "webSocket", "toastMessages"],
);

const SLICED_LAYERS = new Set(["entities", "features", "widgets", "pages"]);

function isLegacyFeatureSlice(relative: readonly string[]): boolean {
  return relative[0] === "features" && LEGACY_FEATURES.has(relative[1] ?? "");
}

function isLegacyZone(relative: readonly string[]): boolean {
  if (relative.length === 0) return false;
  if (LEGACY_TOP_LEVEL.has(relative[0])) return true;
  return isLegacyFeatureSlice(relative);
}

function layerOf(
  root: "app" | "server",
  relative: readonly string[],
): { layer: number; layerName: string } {
  const chain = LAYER_CHAINS[root];
  const index = relative.length > 0 ? chain.indexOf(relative[0]) : -1;
  if (index < 0) return { layer: NaN, layerName: "" };
  return { layer: index, layerName: chain[index] };
}

function sliceOf(
  relative: readonly string[],
  markerEndIdx: number,
): { slice: string | null; sliceRootIdx: number } {
  const canHaveSlice = relative.length > 0 && SLICED_LAYERS.has(relative[0]);
  if (!canHaveSlice || relative.length < 3) {
    return { slice: null, sliceRootIdx: -1 };
  }
  return { slice: relative[1], sliceRootIdx: markerEndIdx + 2 };
}

function isPresentation(
  root: FsdPath["root"],
  filename: string,
  relative: readonly string[],
  role: SliceRole,
): boolean {
  if (root !== "app" || !filename.endsWith(".tsx")) return false;
  if (role === "ui") return true;
  return relative.slice(0, -1).includes("components");
}

function sliceRootPath(
  segments: readonly string[],
  sliceRootIdx: number,
): string | null {
  return sliceRootIdx < 0
    ? null
    : `/${segments.slice(0, sliceRootIdx).join("/")}`;
}

function classifyWithin(
  root: "app" | "server",
  segments: readonly string[],
  markerEnd: number,
): FsdPath {
  const relative = segments.slice(markerEnd);
  const filename = relative[relative.length - 1] ?? "";
  const isTest = /\.test\.tsx?$/.test(filename);
  const legacy = root === "app" && isLegacyZone(relative);
  const { layer, layerName } = layerOf(root, relative);
  const { slice, sliceRootIdx } = legacy
    ? { slice: null, sliceRootIdx: -1 }
    : sliceOf(relative, markerEnd);
  const role = roleOf(relative, isTest, slice !== null);
  return {
    root,
    layer,
    layerName,
    slice,
    sliceRoot: sliceRootPath(segments, sliceRootIdx),
    role,
    isPresentation: isPresentation(root, filename, relative, role),
    isLegacyZone: legacy,
    isTest,
  };
}

/** Shared shape for `outside`/`tools`/`contracts`, which differ only in `root`/`layer`. */
function flatClassification(
  segments: readonly string[],
  root: FsdPath["root"],
  layer: number,
): FsdPath {
  const filename = segments[segments.length - 1] ?? "";
  const isTest = /\.test\.tsx?$/.test(filename);
  return {
    root,
    layer,
    layerName: "",
    slice: null,
    sliceRoot: null,
    role: isTest ? "test" : "other",
    isPresentation: false,
    isLegacyZone: false,
    isTest,
  };
}

/** Maps an absolute file path to its structural classification. Pure, total, never throws. */
export function classify(absolutePath: string): FsdPath {
  const segments = absolutePath.split("/").filter((segment) =>
    segment.length > 0
  );
  const match = findRoot(segments);
  if (match === null) return flatClassification(segments, "outside", NaN);
  if (match.root === "tools") {
    return flatClassification(segments, "tools", NaN);
  }
  if (match.root === "contracts") {
    return flatClassification(segments, "contracts", -1);
  }
  return classifyWithin(match.root, segments, match.markerEnd);
}
