import { assert, assertEquals, assertFalse } from "@std/assert";
import { classify } from "./fsd-path.ts";
import { ignoreExpectedFailure } from "./ignore-expected-failure.ts";

const REPO = "/repo";

Deno.test("happy: app shared layer", () => {
  const classification = classify(`${REPO}/app/shared/api/socket-client.ts`);
  assertEquals(classification.root, "app");
  assertEquals(classification.layer, 0);
  assertEquals(classification.layerName, "shared");
  assertEquals(classification.slice, null);
});

Deno.test("happy: app entities layer with slice and model role", () => {
  const classification = classify(`${REPO}/app/entities/room/room-store.ts`);
  assertEquals(classification.root, "app");
  assertEquals(classification.layer, 1);
  assertEquals(classification.layerName, "entities");
  assertEquals(classification.slice, "room");
  assertEquals(classification.sliceRoot, `${REPO}/app/entities/room`);
  assertEquals(classification.role, "other");
});

Deno.test("happy: app features layer with ui role presentation", () => {
  const classification = classify(`${REPO}/app/features/chat/ui/ChatPanel.tsx`);
  assertEquals(classification.root, "app");
  assertEquals(classification.layer, 2);
  assertEquals(classification.layerName, "features");
  assertEquals(classification.slice, "chat");
  assertEquals(classification.role, "ui");
  assert(classification.isPresentation);
});

Deno.test("happy: app widgets layer model role", () => {
  const classification = classify(
    `${REPO}/app/widgets/reaction-overlay/model/store.ts`,
  );
  assertEquals(classification.layer, 3);
  assertEquals(classification.layerName, "widgets");
  assertEquals(classification.role, "model");
});

Deno.test("happy: app pages layer index role", () => {
  const classification = classify(`${REPO}/app/pages/home/index.ts`);
  assertEquals(classification.layer, 4);
  assertEquals(classification.layerName, "pages");
  assertEquals(classification.slice, "home");
  assertEquals(classification.role, "index");
});

Deno.test("happy: app top-level app layer", () => {
  const classification = classify(`${REPO}/app/app/theme-provider.tsx`);
  assertEquals(classification.layer, 5);
  assertEquals(classification.layerName, "app");
  assertEquals(classification.slice, null);
});

Deno.test("happy: server shared layer", () => {
  const classification = classify(`${REPO}/server/shared/logger/logger.ts`);
  assertEquals(classification.root, "server");
  assertEquals(classification.layer, 0);
  assertEquals(classification.layerName, "shared");
});

Deno.test("happy: server entities layer with slice", () => {
  const classification = classify(`${REPO}/server/entities/room-store/room.ts`);
  assertEquals(classification.root, "server");
  assertEquals(classification.layer, 1);
  assertEquals(classification.slice, "room-store");
});

Deno.test("happy: server features layer api role", () => {
  const classification = classify(
    `${REPO}/server/features/signaling/api/handler.ts`,
  );
  assertEquals(classification.root, "server");
  assertEquals(classification.layer, 2);
  assertEquals(classification.role, "api");
});

Deno.test("happy: server top-level app layer", () => {
  const classification = classify(`${REPO}/server/app/entry.ts`);
  assertEquals(classification.root, "server");
  assertEquals(classification.layer, 3);
  assertEquals(classification.layerName, "app");
});

Deno.test("happy: contracts root", () => {
  const classification = classify(`${REPO}/shared/contracts/room-meta.ts`);
  assertEquals(classification.root, "contracts");
  assertEquals(classification.layer, -1);
  assertEquals(classification.slice, null);
});

Deno.test("happy: tools root", () => {
  const classification = classify(`${REPO}/tools/cli/governed-diff.ts`);
  assertEquals(classification.root, "tools");
  assertFalse(classification.isLegacyZone);
  assert(Number.isNaN(classification.layer));
});

Deno.test("happy: legacy zone top-level directory", () => {
  const classification = classify(`${REPO}/app/common/components/Button.tsx`);
  assertEquals(classification.root, "app");
  assert(classification.isLegacyZone);
  assert(classification.isPresentation);
});

Deno.test("happy: legacy zone nested feature directory", () => {
  const classification = classify(`${REPO}/app/features/webRTC/logic/peer.ts`);
  assertEquals(classification.root, "app");
  assert(classification.isLegacyZone);
});

Deno.test("sad: path outside any known root", () => {
  const classification = classify(`${REPO}/scripts/smoke.sh`);
  assertEquals(classification.root, "outside");
  assert(Number.isNaN(classification.layer));
  assertEquals(classification.slice, null);
  assertEquals(classification.sliceRoot, null);
});

Deno.test("sad: file directly at a layer root looks like a slice but is not", () => {
  const classification = classify(`${REPO}/app/entities/loose-file.ts`);
  assertEquals(classification.root, "app");
  assertEquals(classification.layer, 1);
  assertEquals(classification.slice, null);
  assertEquals(classification.sliceRoot, null);
  assertEquals(classification.role, "other");
});

Deno.test("edge: .tsx in model/ is logic, not presentation", () => {
  const classification = classify(`${REPO}/app/features/chat/model/Store.tsx`);
  assertEquals(classification.role, "model");
  assertFalse(classification.isPresentation);
});

Deno.test("edge: .ts in ui/ is not presentation", () => {
  const classification = classify(`${REPO}/app/features/chat/ui/helpers.ts`);
  assertEquals(classification.role, "ui");
  assertFalse(classification.isPresentation);
});

Deno.test("edge: a slice literally named ui is not itself the ui role", () => {
  const classification = classify(`${REPO}/app/features/ui/model/store.tsx`);
  assertEquals(classification.slice, "ui");
  assertEquals(classification.role, "model");
  assertFalse(classification.isPresentation);
});

Deno.test("edge: nested components/components/ still classifies as presentation", () => {
  const classification = classify(
    `${REPO}/app/routes/legacy/components/components/Deep.tsx`,
  );
  assertEquals(classification.root, "app");
  assert(classification.isPresentation);
});

Deno.test("edge: a test file inside ui/ is role test, not ui", () => {
  const classification = classify(
    `${REPO}/app/features/chat/ui/ChatPanel.test.tsx`,
  );
  assertEquals(classification.role, "test");
  assert(classification.isTest);
});

Deno.test("mutation-guard: components/ vs ui/ disjunction both trigger presentation independently", () => {
  const viaUi = classify(`${REPO}/app/features/chat/ui/Panel.tsx`);
  const viaComponents = classify(
    `${REPO}/app/features/entry-flow/components/Panel.tsx`,
  );
  assert(viaUi.isPresentation);
  assert(viaComponents.isPresentation);
  const viaLib = classify(`${REPO}/app/features/chat/lib/format.tsx`);
  assertFalse(viaLib.isPresentation);
});

Deno.test("mutation-guard: every app layer number is exactly its documented index", () => {
  assertEquals(classify(`${REPO}/app/shared/x.ts`).layer, 0);
  assertEquals(classify(`${REPO}/app/entities/x/y.ts`).layer, 1);
  assertEquals(classify(`${REPO}/app/features/x/y.ts`).layer, 2);
  assertEquals(classify(`${REPO}/app/widgets/x/y.ts`).layer, 3);
  assertEquals(classify(`${REPO}/app/pages/x/y.ts`).layer, 4);
  assertEquals(classify(`${REPO}/app/app/y.ts`).layer, 5);
});

Deno.test("mutation-guard: every server layer number is exactly its documented index", () => {
  assertEquals(classify(`${REPO}/server/shared/x.ts`).layer, 0);
  assertEquals(classify(`${REPO}/server/entities/x/y.ts`).layer, 1);
  assertEquals(classify(`${REPO}/server/features/x/y.ts`).layer, 2);
  assertEquals(classify(`${REPO}/server/app/y.ts`).layer, 3);
});

Deno.test("mutation-guard: isLegacyZone is false for a non-legacy features slice", () => {
  const classification = classify(`${REPO}/app/features/chat/ui/Panel.tsx`);
  assertFalse(classification.isLegacyZone);
});

Deno.test("mutation-guard: isLegacyZone is true only for the exact frozen legacy set", () => {
  assert(classify(`${REPO}/app/context/Session/logic/x.ts`).isLegacyZone);
  assert(classify(`${REPO}/app/routes/route.tsx`).isLegacyZone);
  assert(classify(`${REPO}/app/utils/x.ts`).isLegacyZone);
  assert(classify(`${REPO}/app/features/videoPlayback/x.ts`).isLegacyZone);
  assert(classify(`${REPO}/app/features/webSocket/x.ts`).isLegacyZone);
  assert(classify(`${REPO}/app/features/toastMessages/x.ts`).isLegacyZone);
  assertFalse(
    classify(`${REPO}/app/features/media-source/model/x.ts`).isLegacyZone,
  );
});

Deno.test("logical-limits: invariant slice-null implies sliceRoot-null and role restricted", () => {
  const samples = [
    classify(`${REPO}/app/shared/x.ts`),
    classify(`${REPO}/app/entities/loose.ts`),
    classify(`${REPO}/scripts/x.ts`),
    classify(`${REPO}/tools/x.ts`),
    classify(`${REPO}/shared/contracts/x.ts`),
  ];
  for (const p of samples) {
    if (p.slice === null) {
      assertEquals(p.sliceRoot, null);
      assert(p.role === "other" || p.role === "test");
    }
  }
});

Deno.test("logical-limits: isPresentation implies root is app, across many samples", () => {
  const samples = [
    classify(`${REPO}/app/features/chat/ui/Panel.tsx`),
    classify(`${REPO}/server/features/signaling/ui/Panel.tsx`),
    classify(`${REPO}/tools/lint-plugins/ui/Panel.tsx`),
    classify(`${REPO}/shared/contracts/ui/Panel.tsx`),
  ];
  for (const p of samples) {
    if (p.isPresentation) assertEquals(p.root, "app");
  }
});

Deno.test("logical-limits: root tools implies isLegacyZone false and layer NaN, across samples", () => {
  const samples = [
    classify(`${REPO}/tools/cli/governed-diff.ts`),
    classify(`${REPO}/tools/lint-plugins/shared/fsd-path.ts`),
    classify(`${REPO}/tools/baseline/identity.ts`),
  ];
  for (const p of samples) {
    assertFalse(p.isLegacyZone);
    assert(Number.isNaN(p.layer));
  }
});

Deno.test("logical-limits: classify never throws for pathological input", () => {
  const pathological = [
    "",
    "/",
    "relative/path.ts",
    `${REPO}/app`,
    `${REPO}/`,
    "not-even-a-path",
  ];
  for (const raw of pathological) {
    classify(raw);
  }
});

function assertSliceNullInvariant(
  path: string,
  classification: ReturnType<typeof classify>,
): void {
  if (classification.slice !== null) return;
  assertEquals(
    classification.sliceRoot,
    null,
    `slice-null invariant broken for ${path}`,
  );
  assert(
    classification.role === "other" || classification.role === "test",
    `role restriction broken for ${path}`,
  );
}

function assertPresentationInvariant(
  path: string,
  classification: ReturnType<typeof classify>,
): void {
  if (!classification.isPresentation) return;
  assertEquals(
    classification.root,
    "app",
    `presentation-implies-app broken for ${path}`,
  );
}

function assertToolsRootInvariant(
  path: string,
  classification: ReturnType<typeof classify>,
): void {
  if (classification.root !== "tools") return;
  assertFalse(
    classification.isLegacyZone,
    `tools-legacy invariant broken for ${path}`,
  );
  assert(
    Number.isNaN(classification.layer),
    `tools-layer invariant broken for ${path}`,
  );
}

function assertClassificationInvariants(
  path: string,
  classification: ReturnType<typeof classify>,
): void {
  assertSliceNullInvariant(path, classification);
  assertPresentationInvariant(path, classification);
  assertToolsRootInvariant(path, classification);
}

async function countCheckedFilesUnderRoots(
  roots: string[],
  repoRoot: string,
): Promise<number> {
  let checked = 0;
  for (const root of roots) {
    const base = `${repoRoot}/${root}`;
    try {
      await Deno.stat(base);
    } catch (error) {
      ignoreExpectedFailure(error);
      continue;
    }
    for await (const path of walk(base)) {
      assertClassificationInvariants(path, classify(path));
      checked++;
    }
  }
  return checked;
}

Deno.test("logical-limits: property test over the live repository tree", async () => {
  const roots = ["app", "server", "shared/contracts", "tools"];
  const repoRoot = new URL("../../../", import.meta.url).pathname.replace(
    /\/$/,
    "",
  );
  const checked = await countCheckedFilesUnderRoots(roots, repoRoot);
  assert(
    checked > 10,
    "expected the live tree walk to visit a meaningful number of files",
  );
});

function isSkippableDirEntry(name: string): boolean {
  return name === "node_modules" || name.startsWith(".");
}

async function* walkEntry(
  full: string,
  entry: Deno.DirEntry,
): AsyncGenerator<string> {
  if (entry.isDirectory) {
    yield* walk(full);
    return;
  }
  if (entry.isFile) {
    yield full;
  }
}

async function* walk(dir: string): AsyncGenerator<string> {
  for await (const entry of Deno.readDir(dir)) {
    if (isSkippableDirEntry(entry.name)) continue;
    yield* walkEntry(`${dir}/${entry.name}`, entry);
  }
}
