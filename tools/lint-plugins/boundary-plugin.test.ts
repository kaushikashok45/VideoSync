import { assert, assertEquals } from "@std/assert";
import { createBoundaryPlugin } from "./boundary-plugin.ts";
import { fingerprintStatements } from "./shared/body-fingerprint.ts";
import { violationIdentity } from "../baseline/identity.ts";
import type { ViolationSite } from "../contracts/identity";

const DENO_JSON = JSON.stringify({
  imports: { "~/": "./app/", "contracts/": "./shared/contracts/" },
});

const FIXTURE: Record<string, string> = {
  "app/features/f1/index.ts": "export const f1 = 1;\n",
  "app/features/f1/model/thing.ts": "export const thing = 1;\n",
  "app/features/f1/ui/thing.tsx": "export function Thing() { return 1; }\n",
  "app/features/f1/contracts/thing.ts": "export const c = 1;\n",
  "app/features/f1/model/importer-bad.ts":
    'import { w1 } from "~/widgets/w1/index.ts";\nexport const y = w1;\n',
  "app/features/f1/model/importer-deep.ts":
    'import { thing2 } from "~/features/f2/model/thing.ts";\nexport const y = thing2;\n',
  "app/features/f1/model/importer-index.ts":
    'import { f2 } from "~/features/f2/index.ts";\nexport const y = f2;\n',
  "app/features/f1/model/importer-extensionless.ts":
    'import { f2 } from "~/features/f2";\nexport const y = f2;\n',
  "app/features/f1/model/importer-contract.ts":
    'import { roomMeta } from "contracts/room-meta.ts";\nexport const y = roomMeta;\n',
  "app/features/f1/ui/importer-same-slice.tsx":
    'import { thing } from "../model/thing.ts";\nexport const y = thing;\n',
  "app/features/f2/index.ts": "export const f2 = 1;\n",
  "app/features/f2/model/thing.ts": "export const thing2 = 1;\n",
  "app/features/f2/contracts/thing.ts": "export const c2 = 1;\n",
  "app/widgets/w1/index.ts": "export const w1 = 1;\n",
  "app/widgets/w1/ui/importer-good.tsx":
    'import { f1 } from "~/features/f1/index.ts";\nexport const y = f1;\n',
  "app/widgets/w1/contracts/thing.ts": "export const wc = 1;\n",
  "server/features/sf1/index.ts": "export const sf1 = 1;\n",
  "server/features/sf1/model/importer-contract.ts":
    'import { roomMeta } from "contracts/room-meta.ts";\nexport const y = roomMeta;\n',
  "server/features/sf1/contracts/thing.ts": "export const sc = 1;\n",
  "shared/contracts/room-meta.ts": "export const roomMeta = 1;\n",
  "shared/contracts/importer.ts":
    'import { legacy } from "../../app/features/videoPlayback/legacy.ts";\nexport const y = legacy;\n',
  "app/features/videoPlayback/legacy.ts": "export const legacy = 1;\n",
  "app/features/videoPlayback/importer.ts":
    'import { w1 } from "~/widgets/w1/index.ts";\nexport const y = w1;\n',
  "tools/probe/thing.ts":
    'import { w1 } from "../../app/widgets/w1/index.ts";\nexport const y = w1;\n',
  "app/features/incomplete/model/a.ts": "export const a = 1;\n",
  "app/features/incomplete/model/b.ts": "export const b = 1;\n",
  "app/features/incomplete/ui/c.tsx": "export function C() { return 1; }\n",
  "app/features/dg/index.ts": "export const dg = 1;\n",
  "app/features/dg/contracts/thing.ts": "export const dgc = 1;\n",
  "app/features/dg/utils.ts": "export const u = 1;\n",
  "app/features/dg/lib/some-named-thing.ts": "export const l = 1;\n",
  "app/features/dg/contracts/constants.ts": "export const OK = 1;\n",
  "app/features/dg/model/constants.ts": "export const BAD = 1;\n",
  "app/features/dg/ui/index.ts": "export const nested = 1;\n",
};

function writeTree(repoRoot: string, files: Record<string, string>): void {
  Deno.writeTextFileSync(`${repoRoot}/deno.json`, DENO_JSON);
  for (const [path, content] of Object.entries(files)) {
    const full = `${repoRoot}/${path}`;
    Deno.mkdirSync(full.slice(0, full.lastIndexOf("/")), { recursive: true });
    Deno.writeTextFileSync(full, content);
  }
}

function withTree(run: (repoRoot: string) => void): void {
  const repoRoot = Deno.makeTempDirSync();
  writeTree(repoRoot, FIXTURE);
  try {
    run(repoRoot);
  } finally {
    Deno.removeSync(repoRoot, { recursive: true });
  }
}

function diagnosticsFor(
  code: string,
  repoRoot: string,
  relativePath: string,
): Deno.lint.Diagnostic[] {
  const plugin = createBoundaryPlugin(repoRoot);
  const source = Deno.readTextFileSync(`${repoRoot}/${relativePath}`);
  return Deno.lint.runPlugin(plugin, `${repoRoot}/${relativePath}`, source)
    .filter((diagnostic) => diagnostic.id === code);
}

function diagnosticsAcrossFiles(
  code: string,
  repoRoot: string,
  relativePaths: readonly string[],
): Deno.lint.Diagnostic[] {
  const plugin = createBoundaryPlugin(repoRoot);
  const results: Deno.lint.Diagnostic[] = [];
  for (const relativePath of relativePaths) {
    const source = Deno.readTextFileSync(`${repoRoot}/${relativePath}`);
    results.push(
      ...Deno.lint.runPlugin(plugin, `${repoRoot}/${relativePath}`, source)
        .filter((diagnostic) => diagnostic.id === code),
    );
  }
  return results;
}

// --- layer-order ---------------------------------------------------------

Deno.test("happy: a widget importing a feature via index.ts passes layer-order", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "boundary/layer-order",
      repoRoot,
      "app/widgets/w1/ui/importer-good.tsx",
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("sad: a feature importing a widget fails layer-order", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "boundary/layer-order",
      repoRoot,
      "app/features/f1/model/importer-bad.ts",
    );
    assertEquals(ds.length, 1);
  });
});

Deno.test("sad: shared/contracts/ importing from app/ fails layer-order", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "boundary/layer-order",
      repoRoot,
      "shared/contracts/importer.ts",
    );
    assertEquals(ds.length, 1);
  });
});

Deno.test("happy: app/ importing contracts/ passes layer-order", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "boundary/layer-order",
      repoRoot,
      "app/features/f1/model/importer-contract.ts",
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("happy: server/ importing contracts/ passes layer-order", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "boundary/layer-order",
      repoRoot,
      "server/features/sf1/model/importer-contract.ts",
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("edge: a legacy-zone file with a layer violation is exempt", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "boundary/layer-order",
      repoRoot,
      "app/features/videoPlayback/importer.ts",
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("edge: a tools/** file is exempt from every boundary rule", () => {
  withTree((repoRoot) => {
    for (
      const code of [
        "boundary/layer-order",
        "boundary/deep-import",
        "boundary/cross-slice-same-layer",
      ]
    ) {
      assertEquals(
        diagnosticsFor(code, repoRoot, "tools/probe/thing.ts").length,
        0,
      );
    }
  });
});

// --- deep-import / cross-slice-same-layer ---------------------------------

Deno.test("happy: a cross-slice import of <slice>/index.ts passes deep-import", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "boundary/deep-import",
      repoRoot,
      "app/features/f1/model/importer-index.ts",
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("sad: a cross-slice import of <slice>/model/thing.ts fails deep-import", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "boundary/deep-import",
      repoRoot,
      "app/features/f1/model/importer-deep.ts",
    );
    assertEquals(ds.length, 1);
  });
});

Deno.test("sad: the same deep cross-slice import fails cross-slice-same-layer too", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "boundary/cross-slice-same-layer",
      repoRoot,
      "app/features/f1/model/importer-deep.ts",
    );
    assertEquals(ds.length, 1);
  });
});

Deno.test("edge: an extensionless import resolving to index.ts passes deep-import (sloppyImports)", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "boundary/deep-import",
      repoRoot,
      "app/features/f1/model/importer-extensionless.ts",
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("edge: a same-slice deep import passes deep-import", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "boundary/deep-import",
      repoRoot,
      "app/features/f1/ui/importer-same-slice.tsx",
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("edge: a same-slice import never trips cross-slice-same-layer", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "boundary/cross-slice-same-layer",
      repoRoot,
      "app/features/f1/ui/importer-same-slice.tsx",
    );
    assertEquals(ds.length, 0);
  });
});

// --- missing-index / missing-contract (D-007 latch) -----------------------

Deno.test("logical-limits: a slice missing index.ts gets exactly one missing-index diagnostic across 3 files", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsAcrossFiles(
      "boundary/missing-index",
      repoRoot,
      [
        "app/features/incomplete/model/a.ts",
        "app/features/incomplete/model/b.ts",
        "app/features/incomplete/ui/c.tsx",
      ],
    );
    assertEquals(ds.length, 1);
  });
});

Deno.test("logical-limits: the same slice gets exactly one missing-contract diagnostic across 3 files", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsAcrossFiles(
      "boundary/missing-contract",
      repoRoot,
      [
        "app/features/incomplete/model/a.ts",
        "app/features/incomplete/model/b.ts",
        "app/features/incomplete/ui/c.tsx",
      ],
    );
    assertEquals(ds.length, 1);
  });
});

Deno.test("happy: a slice with an index.ts has zero missing-index diagnostics", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "boundary/missing-index",
      repoRoot,
      "app/features/f1/model/thing.ts",
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("happy: a slice with a contracts/ dir has zero missing-contract diagnostics", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "boundary/missing-contract",
      repoRoot,
      "app/features/f1/model/thing.ts",
    );
    assertEquals(ds.length, 0);
  });
});

// --- no-dumping-ground ------------------------------------------------

Deno.test("sad: a utils.ts inside a slice fails no-dumping-ground", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "boundary/no-dumping-ground",
      repoRoot,
      "app/features/dg/utils.ts",
    );
    assertEquals(ds.length, 1);
  });
});

Deno.test("happy: lib/some-named-thing.ts passes no-dumping-ground", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "boundary/no-dumping-ground",
      repoRoot,
      "app/features/dg/lib/some-named-thing.ts",
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("happy: constants.ts under contracts/ passes no-dumping-ground", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "boundary/no-dumping-ground",
      repoRoot,
      "app/features/dg/contracts/constants.ts",
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("sad: constants.ts elsewhere in a slice fails no-dumping-ground", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "boundary/no-dumping-ground",
      repoRoot,
      "app/features/dg/model/constants.ts",
    );
    assertEquals(ds.length, 1);
  });
});

Deno.test("edge: a slice-root index.ts passes no-dumping-ground", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "boundary/no-dumping-ground",
      repoRoot,
      "app/features/dg/index.ts",
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("sad: a nested index.ts fails no-dumping-ground", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "boundary/no-dumping-ground",
      repoRoot,
      "app/features/dg/ui/index.ts",
    );
    assertEquals(ds.length, 1);
  });
});

// --- contract-first (diff-shape) ------------------------------------------

function sh(cwd: string, args: string[]): void {
  new Deno.Command("git", { args, cwd }).outputSync();
}

function gitRepo(): string {
  const dir = Deno.makeTempDirSync();
  sh(dir, ["init", "-q"]);
  sh(dir, ["config", "user.email", "a@b.com"]);
  sh(dir, ["config", "user.name", "a"]);
  return dir;
}

function stageNewSliceFiles(
  repoRoot: string,
  files: Record<string, string>,
): string[] {
  writeTree(repoRoot, files);
  const relativePaths = Object.keys(files);
  sh(repoRoot, ["add", ...relativePaths]);
  return relativePaths;
}

Deno.test("happy: a new slice with only contract + index.ts passes contract-first", () => {
  const repoRoot = gitRepo();
  try {
    const relativePaths = stageNewSliceFiles(repoRoot, {
      "app/features/newslice/index.ts": "export const n = 1;\n",
      "app/features/newslice/contracts/thing.ts": "export const c = 1;\n",
    });
    const ds = diagnosticsAcrossFiles(
      "boundary/contract-first",
      repoRoot,
      relativePaths,
    );
    assertEquals(ds.length, 0);
  } finally {
    Deno.removeSync(repoRoot, { recursive: true });
  }
});

Deno.test("sad: the same new-slice diff also adding a ui/ file fails contract-first", () => {
  const repoRoot = gitRepo();
  try {
    const relativePaths = stageNewSliceFiles(repoRoot, {
      "app/features/newslice/index.ts": "export const n = 1;\n",
      "app/features/newslice/contracts/thing.ts": "export const c = 1;\n",
      "app/features/newslice/ui/thing.tsx":
        "export function T() { return 1; }\n",
    });
    const ds = diagnosticsAcrossFiles(
      "boundary/contract-first",
      repoRoot,
      relativePaths,
    );
    assertEquals(ds.length, 1);
  } finally {
    Deno.removeSync(repoRoot, { recursive: true });
  }
});

Deno.test("edge: an existing slice adding one new file is not treated as a new slice", () => {
  const repoRoot = gitRepo();
  try {
    writeTree(repoRoot, FIXTURE);
    Deno.writeTextFileSync(
      `${repoRoot}/app/features/f1/ui/new-thing.tsx`,
      "export function N() { return 1; }\n",
    );
    sh(repoRoot, ["add", "app/features/f1/ui/new-thing.tsx"]);
    const ds = diagnosticsFor(
      "boundary/contract-first",
      repoRoot,
      "app/features/f1/ui/new-thing.tsx",
    );
    assertEquals(ds.length, 0);
  } finally {
    Deno.removeSync(repoRoot, { recursive: true });
  }
});

Deno.test("logical-limits: contract-first degrades to zero findings, not a crash, outside a git repo", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "boundary/contract-first",
      repoRoot,
      "app/features/incomplete/model/a.ts",
    );
    assertEquals(ds.length, 0);
  });
});

// --- suppression -----------------------------------------------------------

function captureImportRange(
  source: string,
  fileName: string,
): readonly [number, number] {
  let captured: readonly [number, number] | undefined;
  const probe: Deno.lint.Plugin = {
    name: "probe",
    rules: {
      capture: {
        create(_context) {
          return {
            ImportDeclaration(node) {
              captured ??= node.range;
            },
          };
        },
      },
    },
  };
  Deno.lint.runPlugin(probe, fileName, source);
  if (!captured) throw new Error("expected an ImportDeclaration in fixture");
  return captured;
}

function layerOrderSite(source: string, fileName: string): ViolationSite {
  const range = captureImportRange(source, fileName);
  return {
    ruleId: "boundary/layer-order",
    enclosingFunction: "",
    paramCount: -1,
    bodyFingerprint: fingerprintStatements([{ range }], source),
    sliceKey: null,
  };
}

Deno.test("suppression: a known identity in a known path is silently suppressed", () => {
  withTree((repoRoot) => {
    const relativePath = "app/features/f1/model/importer-bad.ts";
    const source = Deno.readTextFileSync(`${repoRoot}/${relativePath}`);
    const site = layerOrderSite(source, `${repoRoot}/${relativePath}`);
    const id = violationIdentity(site);
    Deno.mkdirSync(`${repoRoot}/tools/baseline`, { recursive: true });
    Deno.writeTextFileSync(
      `${repoRoot}/tools/baseline/baseline.json`,
      JSON.stringify({
        version: 1,
        generatedAt: "2026-08-19T00:00:00Z",
        paths: [relativePath],
        violations: { [id]: 1 },
        perFile: { [relativePath]: 1 },
      }),
    );
    const ds = diagnosticsFor("boundary/layer-order", repoRoot, relativePath);
    assertEquals(ds.length, 0);
  });
});

Deno.test("suppression: a known identity with an unknown path is still reported (new-path zero tolerance)", () => {
  withTree((repoRoot) => {
    const relativePath = "app/features/f1/model/importer-bad.ts";
    const source = Deno.readTextFileSync(`${repoRoot}/${relativePath}`);
    const site = layerOrderSite(source, `${repoRoot}/${relativePath}`);
    const id = violationIdentity(site);
    Deno.mkdirSync(`${repoRoot}/tools/baseline`, { recursive: true });
    Deno.writeTextFileSync(
      `${repoRoot}/tools/baseline/baseline.json`,
      JSON.stringify({
        version: 1,
        generatedAt: "2026-08-19T00:00:00Z",
        paths: ["app/features/f1/model/some-other-file.ts"],
        violations: { [id]: 1 },
        perFile: {},
      }),
    );
    const ds = diagnosticsFor("boundary/layer-order", repoRoot, relativePath);
    assertEquals(ds.length, 1);
  });
});

Deno.test("logical-limits: with no baseline present, every boundary rule reports (fail closed)", () => {
  withTree((repoRoot) => {
    const layerOrder = diagnosticsFor(
      "boundary/layer-order",
      repoRoot,
      "app/features/f1/model/importer-bad.ts",
    );
    const dumping = diagnosticsFor(
      "boundary/no-dumping-ground",
      repoRoot,
      "app/features/dg/utils.ts",
    );
    assertEquals(layerOrder.length, 1);
    assertEquals(dumping.length, 1);
  });
});

// --- plugin identity ---------------------------------------------------

Deno.test("logical-limits: the plugin name matches the required pattern", () => {
  withTree((repoRoot) => {
    const plugin = createBoundaryPlugin(repoRoot);
    assert(/^[a-z-]+$/.test(plugin.name));
  });
});
