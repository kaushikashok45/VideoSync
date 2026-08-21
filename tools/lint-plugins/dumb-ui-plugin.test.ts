import { assert, assertEquals } from "@std/assert";
import { createDumbUiPlugin } from "./dumb-ui-plugin.ts";
import { fingerprintStatements } from "./shared/body-fingerprint.ts";
import { violationIdentity } from "../baseline/identity.ts";
import type { ViolationSite } from "../contracts/identity";

const DENO_JSON = JSON.stringify({
  imports: { "~/": "./app/", "contracts/": "./shared/contracts/" },
});

const FIXTURE: Record<string, string> = {
  "app/features/f1/index.ts": "export const f1 = 1;\n",
  "app/features/f1/contracts/thing.ts": "export const c = 1;\n",
  "app/features/f1/model/thing.ts": "export const thing = 1;\n",
  "app/features/f1/ui/bar.tsx": "export function Bar() { return null; }\n",
  "app/features/f1/ui/store-panel.tsx":
    "export function StorePanel() { return null; }\n",
  "app/features/f1/ui/good-react.tsx":
    'import React from "react";\nexport function Good() { return React.createElement("div"); }\n',
  "app/features/f1/ui/good-uikit.tsx":
    'import { Button } from "~/shared/ui-kit/button.tsx";\nexport function Good() { return Button; }\n',
  "app/features/f1/ui/good-sibling.tsx":
    'import { Bar } from "./bar.tsx";\nexport function Good() { return Bar; }\n',
  "app/features/f1/ui/good-contracts.tsx":
    'import { c } from "../contracts/thing.ts";\nexport function Good() { return c; }\n',
  "app/features/f1/ui/bad-model.tsx":
    'import { thing } from "../model/thing.ts";\nexport function Bad() { return thing; }\n',
  "app/features/f1/ui/bad-store-specifier.tsx":
    'import { StorePanel } from "./store-panel.tsx";\nexport function Bad() { return StorePanel; }\n',
  "app/features/f1/ui/bad-entities.tsx":
    'import { thing2 } from "~/entities/e1/model/thing.ts";\nexport function Bad() { return thing2; }\n',
  "app/entities/e1/index.ts": "export const e1 = 1;\n",
  "app/entities/e1/model/thing.ts": "export const thing2 = 1;\n",
  "app/features/f1/ui/plain.ts":
    'import { thing } from "../model/thing.ts";\nimport { useState } from "react";\nexport function plain() { useState(0); return thing; }\n',
  "app/features/f1/model/uses-state.ts":
    'import { useState } from "react";\nexport function usesState() { useState(0); return 1; }\n',
  "app/features/f1/ui/bad-usestate.tsx":
    'import { useState } from "react";\nexport function C() {\n  useState(0);\n  return null;\n}\n',
  "app/features/f1/ui/bad-useeffect.tsx":
    'import { useEffect } from "react";\nexport function C() {\n  useEffect(() => {}, []);\n  return null;\n}\n',
  "app/features/f1/ui/bad-usereducer.tsx":
    'import { useReducer } from "react";\nexport function C() {\n  useReducer((s) => s, 0);\n  return null;\n}\n',
  "app/features/f1/ui/bad-usecontext.tsx":
    'import { useContext, createContext } from "react";\nconst Ctx = createContext(0);\nexport function C() {\n  useContext(Ctx);\n  return null;\n}\n',
  "app/features/f1/ui/bad-react-usestate.tsx":
    'import React from "react";\nexport function C() {\n  React.useState(0);\n  return null;\n}\n',
  "app/features/f1/ui/good-useref.tsx":
    'import { useRef } from "react";\nexport function C() {\n  useRef(null);\n  return null;\n}\n',
  "app/features/f1/ui/good-usestateful-lookalike.tsx":
    "function useStateful() { return 1; }\nexport function C() {\n  useStateful();\n  return null;\n}\n",
  "app/features/f1/ui/bad-bare-store-lib.tsx":
    'import { create } from "zustand";\nexport function Bad() { return create; }\n',
  "app/shared/ui-kit/button.tsx": "export function Button() { return null; }\n",
  "app/features/videoPlayback/components/legacy-good.tsx":
    'import React from "react";\nexport function Legacy() { return React.createElement("div"); }\n',
  "app/features/videoPlayback/components/legacy-bad.tsx":
    'import { legacyThing } from "../model/legacy-thing.ts";\nexport function Legacy() { return legacyThing; }\n',
  "app/features/videoPlayback/model/legacy-thing.ts":
    "export const legacyThing = 1;\n",
  "app/features/videoPlayback/components/legacy-usestate.tsx":
    'import { useState } from "react";\nexport function Legacy() {\n  useState(0);\n  return null;\n}\n',
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
  const plugin = createDumbUiPlugin(repoRoot);
  const source = Deno.readTextFileSync(`${repoRoot}/${relativePath}`);
  return Deno.lint.runPlugin(plugin, `${repoRoot}/${relativePath}`, source)
    .filter((diagnostic) => diagnostic.id === code);
}

// --- no-smart-import --------------------------------------------------

Deno.test("sad: importing the own slice's model/ fails no-smart-import", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "dumb-ui/no-smart-import",
      repoRoot,
      "app/features/f1/ui/bad-model.tsx",
    );
    assertEquals(ds.length, 1);
  });
});

Deno.test("happy: importing app/shared/ui-kit passes no-smart-import", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "dumb-ui/no-smart-import",
      repoRoot,
      "app/features/f1/ui/good-uikit.tsx",
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("happy: importing react passes no-smart-import", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "dumb-ui/no-smart-import",
      repoRoot,
      "app/features/f1/ui/good-react.tsx",
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("happy: importing a sibling ui/bar.tsx passes no-smart-import", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "dumb-ui/no-smart-import",
      repoRoot,
      "app/features/f1/ui/good-sibling.tsx",
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("edge: importing the own slice's contracts/ passes no-smart-import (documented limitation)", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "dumb-ui/no-smart-import",
      repoRoot,
      "app/features/f1/ui/good-contracts.tsx",
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("sad: a specifier containing 'store' fails no-smart-import even for an otherwise-legal sibling", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "dumb-ui/no-smart-import",
      repoRoot,
      "app/features/f1/ui/bad-store-specifier.tsx",
    );
    assertEquals(ds.length, 1);
  });
});

Deno.test("sad: importing another slice's entities/ fails no-smart-import", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "dumb-ui/no-smart-import",
      repoRoot,
      "app/features/f1/ui/bad-entities.tsx",
    );
    assertEquals(ds.length, 1);
  });
});

Deno.test("edge: legacy components/ is in scope and behaves like ui/ for no-smart-import", () => {
  withTree((repoRoot) => {
    const good = diagnosticsFor(
      "dumb-ui/no-smart-import",
      repoRoot,
      "app/features/videoPlayback/components/legacy-good.tsx",
    );
    const bad = diagnosticsFor(
      "dumb-ui/no-smart-import",
      repoRoot,
      "app/features/videoPlayback/components/legacy-bad.tsx",
    );
    assertEquals(good.length, 0);
    assertEquals(bad.length, 1);
  });
});

// --- no-local-state -----------------------------------------------------

Deno.test("sad: useState fails no-local-state", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "dumb-ui/no-local-state",
      repoRoot,
      "app/features/f1/ui/bad-usestate.tsx",
    );
    assertEquals(ds.length, 1);
  });
});

Deno.test("sad: useEffect fails no-local-state", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "dumb-ui/no-local-state",
      repoRoot,
      "app/features/f1/ui/bad-useeffect.tsx",
    );
    assertEquals(ds.length, 1);
  });
});

Deno.test("sad: useReducer fails no-local-state", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "dumb-ui/no-local-state",
      repoRoot,
      "app/features/f1/ui/bad-usereducer.tsx",
    );
    assertEquals(ds.length, 1);
  });
});

Deno.test("sad: useContext fails no-local-state", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "dumb-ui/no-local-state",
      repoRoot,
      "app/features/f1/ui/bad-usecontext.tsx",
    );
    assertEquals(ds.length, 1);
  });
});

Deno.test("sad: React.useState(...) member-call form fails no-local-state", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "dumb-ui/no-local-state",
      repoRoot,
      "app/features/f1/ui/bad-react-usestate.tsx",
    );
    assertEquals(ds.length, 1);
  });
});

Deno.test("edge: useRef(null) passes no-local-state (documented limitation)", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "dumb-ui/no-local-state",
      repoRoot,
      "app/features/f1/ui/good-useref.tsx",
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("mutation-guard: useStateful is not flagged -- exact callee name match, not a substring check", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "dumb-ui/no-local-state",
      repoRoot,
      "app/features/f1/ui/good-usestateful-lookalike.tsx",
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("mutation-guard: a bare package outside the allow-list fails no-smart-import even without 'store' in its name", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "dumb-ui/no-smart-import",
      repoRoot,
      "app/features/f1/ui/bad-bare-store-lib.tsx",
    );
    assertEquals(ds.length, 1);
  });
});

Deno.test("edge: legacy components/ is in scope and behaves like ui/ for no-local-state", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "dumb-ui/no-local-state",
      repoRoot,
      "app/features/videoPlayback/components/legacy-usestate.tsx",
    );
    assertEquals(ds.length, 1);
  });
});

// --- scope ---------------------------------------------------------------

Deno.test("edge: a .ts file under ui/ is out of scope for both rules", () => {
  withTree((repoRoot) => {
    const smart = diagnosticsFor(
      "dumb-ui/no-smart-import",
      repoRoot,
      "app/features/f1/ui/plain.ts",
    );
    const state = diagnosticsFor(
      "dumb-ui/no-local-state",
      repoRoot,
      "app/features/f1/ui/plain.ts",
    );
    assertEquals(smart.length, 0);
    assertEquals(state.length, 0);
  });
});

Deno.test("edge: a model/ file using useState is out of scope for no-local-state", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "dumb-ui/no-local-state",
      repoRoot,
      "app/features/f1/model/uses-state.ts",
    );
    assertEquals(ds.length, 0);
  });
});

// --- suppression -----------------------------------------------------------

function captureFirstNodeRange(
  source: string,
  fileName: string,
  event: "ImportDeclaration" | "CallExpression",
): readonly [number, number] {
  let captured: readonly [number, number] | undefined;
  const probe: Deno.lint.Plugin = {
    name: "probe",
    rules: {
      capture: {
        create(_context) {
          return {
            [event](node: { range: readonly [number, number] }) {
              captured ??= node.range;
            },
          };
        },
      },
    },
  };
  Deno.lint.runPlugin(probe, fileName, source);
  if (!captured) throw new Error(`expected a ${event} in fixture`);
  return captured;
}

function noSmartImportSite(source: string, fileName: string): ViolationSite {
  const range = captureFirstNodeRange(source, fileName, "ImportDeclaration");
  return {
    ruleId: "dumb-ui/no-smart-import",
    enclosingFunction: "",
    paramCount: -1,
    bodyFingerprint: fingerprintStatements([{ range }], source),
    sliceKey: null,
  };
}

function writeBaselineFile(
  repoRoot: string,
  paths: string[],
  id: string,
  perFile: Record<string, number>,
): void {
  Deno.mkdirSync(`${repoRoot}/tools/baseline`, { recursive: true });
  Deno.writeTextFileSync(
    `${repoRoot}/tools/baseline/baseline.json`,
    JSON.stringify({
      version: 1,
      generatedAt: "2026-08-19T00:00:00Z",
      paths,
      violations: { [id]: 1 },
      perFile,
    }),
  );
}

Deno.test("suppression: a known identity in a known path is silently suppressed", () => {
  withTree((repoRoot) => {
    const relativePath = "app/features/f1/ui/bad-model.tsx";
    const source = Deno.readTextFileSync(`${repoRoot}/${relativePath}`);
    const site = noSmartImportSite(source, `${repoRoot}/${relativePath}`);
    const id = violationIdentity(site);
    writeBaselineFile(repoRoot, [relativePath], id, { [relativePath]: 1 });
    const ds = diagnosticsFor(
      "dumb-ui/no-smart-import",
      repoRoot,
      relativePath,
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("suppression: a known identity with an unknown path is still reported (new-path zero tolerance)", () => {
  withTree((repoRoot) => {
    const relativePath = "app/features/f1/ui/bad-model.tsx";
    const source = Deno.readTextFileSync(`${repoRoot}/${relativePath}`);
    const site = noSmartImportSite(source, `${repoRoot}/${relativePath}`);
    const id = violationIdentity(site);
    writeBaselineFile(
      repoRoot,
      ["app/features/f1/ui/some-other-file.tsx"],
      id,
      {},
    );
    const ds = diagnosticsFor(
      "dumb-ui/no-smart-import",
      repoRoot,
      relativePath,
    );
    assertEquals(ds.length, 1);
  });
});

Deno.test("logical-limits: with no baseline present, every dumb-ui rule reports (fail closed)", () => {
  withTree((repoRoot) => {
    const smart = diagnosticsFor(
      "dumb-ui/no-smart-import",
      repoRoot,
      "app/features/f1/ui/bad-model.tsx",
    );
    const state = diagnosticsFor(
      "dumb-ui/no-local-state",
      repoRoot,
      "app/features/f1/ui/bad-usestate.tsx",
    );
    assertEquals(smart.length, 1);
    assertEquals(state.length, 1);
  });
});

// --- plugin identity ---------------------------------------------------

Deno.test("logical-limits: the plugin name matches the required pattern", () => {
  withTree((repoRoot) => {
    const plugin = createDumbUiPlugin(repoRoot);
    assert(/^[a-z-]+$/.test(plugin.name));
  });
});
