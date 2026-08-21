import { assert, assertEquals } from "@std/assert";
import { createSemanticsPlugin } from "./semantics-plugin.ts";
import { fingerprintStatements } from "./shared/body-fingerprint.ts";
import { violationIdentity } from "../baseline/identity.ts";
import type { ViolationSite } from "../contracts/identity";

const FIXTURE: Record<string, string> = {
  // --- one-public-export --------------------------------------------------
  "app/features/f1/model/multi.ts":
    "export const a = 1;\nexport const b = 2;\n",
  "app/features/f1/model/single.ts": "export const a = 1;\n",
  "app/features/f1/index.ts":
    "export const a = 1;\nexport const b = 2;\nexport const c = 3;\n",
  "app/features/f1/contracts/thing.ts":
    "export const a = 1;\nexport const b = 2;\n",
  "misc/scratch-multi.ts": "export const a = 1;\nexport const b = 2;\n",

  // --- readonly-entity-fields ----------------------------------------------
  "app/entities/room/model/room.ts":
    "interface Room {\n  readonly id: string;\n  name: string;\n}\n",
  "app/entities/room/model/ok.ts":
    "interface Room {\n  readonly id: string;\n  readonly name: string;\n}\n",
  "app/features/f1/ui/not-in-scope.ts":
    "interface Panel {\n  label: string;\n}\n",

  // --- branded-ids -----------------------------------------------------------
  "app/entities/room/model/ids-bare.ts":
    "interface Room {\n  readonly roomId: string;\n  readonly hostCode: number;\n}\n",
  "app/entities/room/model/ids-branded.ts":
    'type RoomId = string & { readonly __brand: "RoomId" };\n' +
    "interface Room {\n  readonly roomId: RoomId;\n}\n",
  "app/features/f1/ui/ids-out-of-scope.ts":
    "interface Panel {\n  readonly panelId: string;\n}\n",

  // --- no-default-export -----------------------------------------------------
  "app/features/f1/ui/bad-default.tsx":
    "export default function Bad() { return null; }\n",
  "app/features/f1/ui/good-named.tsx":
    "export function Good() { return null; }\n",
  "app/root.tsx": "export default function Root() { return null; }\n",
  "tools/lint-plugins/entries/structural.ts": "export default { name: 1 };\n",
  "app/routes/_index/components/Homepage.tsx":
    "export default function Homepage() { return null; }\n",
  "misc/scratch-default.ts": "export default 1;\n",

  // --- no-empty-names ----------------------------------------------------
  "app/features/f1/model/bad-name.ts":
    "export function f() {\n  const data = 1;\n  return data;\n}\n",
  "app/features/f1/model/good-name.ts":
    "export function f() {\n  const roomCount = 1;\n  return roomCount;\n}\n",
  "app/features/f1/model/loop-head.ts":
    "export function f() {\n  for (let i = 0; i < 3; i++) {\n    console.log(i);\n  }\n}\n",
  "misc/scratch-empty-name.ts": "const data = 1;\n",

  // --- no-demeter ----------------------------------------------------------
  "app/entities/room/model/room-value.ts":
    "export const room = { a: { b: { c: 1 } } };\n",
  "app/features/f1/model/demeter-bad.ts":
    'import { room } from "../../../entities/room/model/room-value";\n' +
    "export function f() {\n  return room.a.b.c;\n}\n",
  "app/features/f1/model/demeter-this.ts":
    "export class C {\n  m() {\n    return this.a.b.c;\n  }\n}\n",
  "app/features/f1/model/demeter-local.ts":
    "const room = { a: { b: { c: 1 } } };\n" +
    "export function f() {\n  return room.a.b.c;\n}\n",

  // --- no-entity-interrogation -----------------------------------------------
  "app/features/f1/model/interrogate-bad.ts":
    'import { room } from "../../../entities/room/model/room-value";\n' +
    'export function f() {\n  return room.a === "x";\n}\n',
  "app/features/f1/model/interrogate-local.ts": "const room = { a: 1 };\n" +
    "export function f() {\n  return room.a === 1;\n}\n",

  // --- no-foreign-switch -------------------------------------------------------
  "app/features/f1/model/switch-bad.ts":
    'import { room } from "../../../entities/room/model/room-value";\n' +
    "export function f() {\n  switch (room.a) {\n    default:\n      return 0;\n  }\n}\n",
  "app/features/f1/model/switch-local.ts": "const room = { a: 1 };\n" +
    "export function f() {\n  switch (room.a) {\n    default:\n      return 0;\n  }\n}\n",
  "app/features/f1/model/switch-plain.ts":
    "export function f(x: number) {\n  switch (x) {\n    default:\n      return 0;\n  }\n}\n",

  // --- no-concrete-transport-in-domain -----------------------------------------
  "app/entities/room/model/transport-bad.ts":
    'import { io } from "socket.io-client";\nexport const client = io;\n',
  "app/features/f1/api/transport-ok.ts":
    'import { io } from "socket.io-client";\nexport const client = io;\n',
  "app/entities/room/model/transport-allowed.ts":
    'import { useState } from "react";\nexport const hook = useState;\n',

  // --- no-stub-override ----------------------------------------------------
  "app/features/f1/model/stub-bad.ts":
    "export class Sub {\n  override m(): void {\n    throw new Error(" +
    '"nope");\n  }\n}\n',
  "app/features/f1/model/stub-ok.ts":
    "export class Sub {\n  override m(): void {\n    doThing();\n  }\n}\n",
  "app/features/f1/model/stub-not-override.ts":
    "export class Base {\n  m(): void {\n    throw new Error(" +
    '"nope");\n  }\n}\n',

  // --- no-swallowed-error --------------------------------------------------
  "app/features/f1/model/swallow-bad.ts":
    "export function f() {\n  try {\n    doThing();\n  } catch {\n  }\n}\n",
  "app/features/f1/model/swallow-rethrow.ts":
    "export function f() {\n  try {\n    doThing();\n  } catch (e) {\n    throw e;\n  }\n}\n",
  "app/features/f1/model/swallow-report.ts":
    "export function f() {\n  try {\n    doThing();\n  } catch (e) {\n    logger.error(e);\n  }\n}\n",

  // --- no-magic-literal ------------------------------------------------------
  "app/entities/room/model/magic-bad.ts":
    "export function f() {\n  return 42;\n}\n",
  "app/entities/room/model/magic-ok.ts": "const arr = [0, 1, 0];\n" +
    "export function f() {\n" +
    "  const a = 0;\n  const b = 1;\n  const c = -1;\n  const d = '';\n" +
    "  const e = true;\n  const g = false;\n  return arr[0];\n}\n",
  "app/features/f1/ui/magic-out.ts": "export function f() {\n  return 42;\n}\n",
  "app/entities/room/model/magic-named-const.ts":
    "const MAX_RETRIES = 42;\nexport function f() {\n  return MAX_RETRIES;\n}\n",
  "app/entities/room/model/magic-bad.test.ts":
    "import { assertEquals } from '@std/assert';\n" +
    "Deno.test('t', () => {\n  assertEquals(1 + 1, 2);\n  return 42;\n});\n",

  // --- no-loose-assertion --------------------------------------------------
  "app/features/f1/model/assert-bad.ts":
    "export function f(x: unknown) {\n  return x as string;\n}\n",
  "app/features/f1/api/assert-ok.ts":
    "export function f(x: unknown) {\n  return x as string;\n}\n",
  "app/features/f1/model/assert-bang.ts":
    "export function f(x?: string) {\n  return x!.length;\n}\n",

  // --- no-unowned-todo ---------------------------------------------------------
  "app/features/f1/model/todo-bad.ts":
    "// TODO fix this later\nexport const a = 1;\n",
  "app/features/f1/model/todo-ok.ts":
    "// TODO(ashok): fix this later (#123)\nexport const a = 1;\n",
  "app/features/f1/model/todo-none.ts":
    "// just a normal comment\nexport const a = 1;\n",

  // --- no-console ------------------------------------------------------------
  "app/features/f1/model/console-bad.ts":
    "export function f() {\n  console.log('hi');\n}\n",
  "server/shared/logger/console-ok.ts":
    "export function f() {\n  console.log('hi');\n}\n",
  "app/features/f1/model/console-capital.ts":
    "const Console = { log: (x: unknown) => x };\n" +
    "export function f() {\n  Console.log('hi');\n}\n",
  "tools/cli/console-exempt.ts":
    "export function f() {\n  console.log('hi');\n}\n",
  "tools/lint-plugins/console-still-caught.ts":
    "export function f() {\n  console.log('hi');\n}\n",
};

function writeTree(repoRoot: string, files: Record<string, string>): void {
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
  const plugin = createSemanticsPlugin(repoRoot);
  const source = Deno.readTextFileSync(`${repoRoot}/${relativePath}`);
  return Deno.lint.runPlugin(plugin, `${repoRoot}/${relativePath}`, source)
    .filter((diagnostic) => diagnostic.id === code);
}

// --- one-public-export ----------------------------------------------------

Deno.test("happy: two exports in one module fails one-public-export", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/one-public-export",
      repoRoot,
      "app/features/f1/model/multi.ts",
    );
    assertEquals(ds.length, 1);
  });
});

Deno.test("sad: a single export passes one-public-export", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/one-public-export",
      repoRoot,
      "app/features/f1/model/single.ts",
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("edge: index.ts with several exports passes one-public-export (exempt)", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/one-public-export",
      repoRoot,
      "app/features/f1/index.ts",
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("edge: a contracts/ file with several exports passes one-public-export (exempt)", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/one-public-export",
      repoRoot,
      "app/features/f1/contracts/thing.ts",
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("edge: a path outside every known root is not a one-public-export violation", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/one-public-export",
      repoRoot,
      "misc/scratch-multi.ts",
    );
    assertEquals(ds.length, 0);
  });
});

// --- readonly-entity-fields ------------------------------------------------

Deno.test("happy: a non-readonly entity field fails readonly-entity-fields", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/readonly-entity-fields",
      repoRoot,
      "app/entities/room/model/room.ts",
    );
    assertEquals(ds.length, 1);
  });
});

Deno.test("sad: all-readonly entity fields pass readonly-entity-fields", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/readonly-entity-fields",
      repoRoot,
      "app/entities/room/model/ok.ts",
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("edge: a non-readonly field outside entities/model is out of scope", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/readonly-entity-fields",
      repoRoot,
      "app/features/f1/ui/not-in-scope.ts",
    );
    assertEquals(ds.length, 0);
  });
});

// --- branded-ids -------------------------------------------------------------

Deno.test("happy: a bare string/number Id/Code/Key field fails branded-ids", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/branded-ids",
      repoRoot,
      "app/entities/room/model/ids-bare.ts",
    );
    assertEquals(ds.length, 2);
  });
});

Deno.test("sad: a properly branded RoomId field passes branded-ids", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/branded-ids",
      repoRoot,
      "app/entities/room/model/ids-branded.ts",
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("edge: an Id field outside entities/shared-contracts is out of scope", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/branded-ids",
      repoRoot,
      "app/features/f1/ui/ids-out-of-scope.ts",
    );
    assertEquals(ds.length, 0);
  });
});

// --- no-default-export -------------------------------------------------------

Deno.test("happy: export default fails no-default-export outside the carve-out", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-default-export",
      repoRoot,
      "app/features/f1/ui/bad-default.tsx",
    );
    assertEquals(ds.length, 1);
  });
});

Deno.test("sad: a named export passes no-default-export", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-default-export",
      repoRoot,
      "app/features/f1/ui/good-named.tsx",
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("edge: app/root.tsx's default export passes no-default-export (framework carve-out)", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-default-export",
      repoRoot,
      "app/root.tsx",
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("edge: a deno.json lint.plugins entry shim's default export is exempt", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-default-export",
      repoRoot,
      "tools/lint-plugins/entries/structural.ts",
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("edge: D-016 -- a colocated components/ file under app/routes/ is NOT exempt and must report", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-default-export",
      repoRoot,
      "app/routes/_index/components/Homepage.tsx",
    );
    assertEquals(ds.length, 1);
  });
});

Deno.test("edge: a path outside every known root is not a no-default-export violation", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-default-export",
      repoRoot,
      "misc/scratch-default.ts",
    );
    assertEquals(ds.length, 0);
  });
});

// --- no-empty-names ----------------------------------------------------------

Deno.test("happy: a banned identifier name fails no-empty-names", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-empty-names",
      repoRoot,
      "app/features/f1/model/bad-name.ts",
    );
    assertEquals(ds.length, 1);
  });
});

Deno.test("sad: a meaningful identifier name passes no-empty-names", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-empty-names",
      repoRoot,
      "app/features/f1/model/good-name.ts",
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("edge: a single-letter identifier in a for-loop head passes no-empty-names", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-empty-names",
      repoRoot,
      "app/features/f1/model/loop-head.ts",
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("edge: a path outside every known root is not a no-empty-names violation", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-empty-names",
      repoRoot,
      "misc/scratch-empty-name.ts",
    );
    assertEquals(ds.length, 0);
  });
});

// --- no-demeter --------------------------------------------------------------

Deno.test("happy: a.b.c rooted at an imported entity fails no-demeter", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-demeter",
      repoRoot,
      "app/features/f1/model/demeter-bad.ts",
    );
    assertEquals(ds.length, 1);
  });
});

Deno.test("sad: this.a.b.c passes no-demeter (this is not a foreign root)", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-demeter",
      repoRoot,
      "app/features/f1/model/demeter-this.ts",
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("edge: a.b.c on a locally declared object passes no-demeter", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-demeter",
      repoRoot,
      "app/features/f1/model/demeter-local.ts",
    );
    assertEquals(ds.length, 0);
  });
});

// --- no-entity-interrogation -------------------------------------------------

Deno.test("happy: comparing an imported entity member to a literal fails no-entity-interrogation", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-entity-interrogation",
      repoRoot,
      "app/features/f1/model/interrogate-bad.ts",
    );
    assertEquals(ds.length, 1);
  });
});

Deno.test("sad: comparing a locally declared object's member to a literal passes no-entity-interrogation", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-entity-interrogation",
      repoRoot,
      "app/features/f1/model/interrogate-local.ts",
    );
    assertEquals(ds.length, 0);
  });
});

// --- no-foreign-switch ---------------------------------------------------------

Deno.test("happy: switching on an imported entity's member fails no-foreign-switch", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-foreign-switch",
      repoRoot,
      "app/features/f1/model/switch-bad.ts",
    );
    assertEquals(ds.length, 1);
  });
});

Deno.test("sad: switching on a locally declared object's member passes no-foreign-switch", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-foreign-switch",
      repoRoot,
      "app/features/f1/model/switch-local.ts",
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("edge: switching on a plain identifier passes no-foreign-switch", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-foreign-switch",
      repoRoot,
      "app/features/f1/model/switch-plain.ts",
    );
    assertEquals(ds.length, 0);
  });
});

// --- no-concrete-transport-in-domain ------------------------------------------

Deno.test("happy: entities/** importing socket.io-client fails no-concrete-transport-in-domain", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-concrete-transport-in-domain",
      repoRoot,
      "app/entities/room/model/transport-bad.ts",
    );
    assertEquals(ds.length, 1);
  });
});

Deno.test("sad: api/** importing socket.io-client passes no-concrete-transport-in-domain", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-concrete-transport-in-domain",
      repoRoot,
      "app/features/f1/api/transport-ok.ts",
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("edge: entities/** importing an unlisted package passes no-concrete-transport-in-domain", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-concrete-transport-in-domain",
      repoRoot,
      "app/entities/room/model/transport-allowed.ts",
    );
    assertEquals(ds.length, 0);
  });
});

// --- no-stub-override ----------------------------------------------------------

Deno.test("happy: an override method whose body is only a throw fails no-stub-override", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-stub-override",
      repoRoot,
      "app/features/f1/model/stub-bad.ts",
    );
    assertEquals(ds.length, 1);
  });
});

Deno.test("sad: an override method with a real body passes no-stub-override", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-stub-override",
      repoRoot,
      "app/features/f1/model/stub-ok.ts",
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("edge: a throw-only method without override passes no-stub-override", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-stub-override",
      repoRoot,
      "app/features/f1/model/stub-not-override.ts",
    );
    assertEquals(ds.length, 0);
  });
});

// --- no-swallowed-error ----------------------------------------------------------

Deno.test("happy: an empty catch fails no-swallowed-error", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-swallowed-error",
      repoRoot,
      "app/features/f1/model/swallow-bad.ts",
    );
    assertEquals(ds.length, 1);
  });
});

Deno.test("sad: a catch that rethrows passes no-swallowed-error", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-swallowed-error",
      repoRoot,
      "app/features/f1/model/swallow-rethrow.ts",
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("edge: a catch that calls a logger passes no-swallowed-error", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-swallowed-error",
      repoRoot,
      "app/features/f1/model/swallow-report.ts",
    );
    assertEquals(ds.length, 0);
  });
});

// --- no-magic-literal ------------------------------------------------------------

Deno.test("happy: a raw number literal in model/** fails no-magic-literal", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-magic-literal",
      repoRoot,
      "app/entities/room/model/magic-bad.ts",
    );
    assertEquals(ds.length, 1);
  });
});

Deno.test("sad: 0, 1, -1, '', true, false, and an array index in model/** pass no-magic-literal", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-magic-literal",
      repoRoot,
      "app/entities/room/model/magic-ok.ts",
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("edge: a raw literal outside entities/model is out of scope for no-magic-literal", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-magic-literal",
      repoRoot,
      "app/features/f1/ui/magic-out.ts",
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("edge: a literal assigned to an UPPER_CASE constant passes no-magic-literal", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-magic-literal",
      repoRoot,
      "app/entities/room/model/magic-named-const.ts",
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("edge: a test-role file in entities/model passes no-magic-literal (test exemption)", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-magic-literal",
      repoRoot,
      "app/entities/room/model/magic-bad.test.ts",
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("edge: a non-test file in the same directory still fails no-magic-literal", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-magic-literal",
      repoRoot,
      "app/entities/room/model/magic-bad.ts",
    );
    assertEquals(ds.length, 1);
  });
});

// --- no-loose-assertion -----------------------------------------------------------

Deno.test("happy: an `as` cast outside api/** fails no-loose-assertion", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-loose-assertion",
      repoRoot,
      "app/features/f1/model/assert-bad.ts",
    );
    assertEquals(ds.length, 1);
  });
});

Deno.test("sad: an `as` cast inside api/** passes no-loose-assertion", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-loose-assertion",
      repoRoot,
      "app/features/f1/api/assert-ok.ts",
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("edge: a non-null `!` outside api/** fails no-loose-assertion", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-loose-assertion",
      repoRoot,
      "app/features/f1/model/assert-bang.ts",
    );
    assertEquals(ds.length, 1);
  });
});

// --- no-unowned-todo -----------------------------------------------------------------

Deno.test("happy: a TODO without an owner or reference fails no-unowned-todo", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-unowned-todo",
      repoRoot,
      "app/features/f1/model/todo-bad.ts",
    );
    assertEquals(ds.length, 1);
  });
});

Deno.test("sad: a TODO with an owner and a reference passes no-unowned-todo", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-unowned-todo",
      repoRoot,
      "app/features/f1/model/todo-ok.ts",
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("edge: a comment without the word TODO passes no-unowned-todo", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-unowned-todo",
      repoRoot,
      "app/features/f1/model/todo-none.ts",
    );
    assertEquals(ds.length, 0);
  });
});

// --- no-console ----------------------------------------------------------------------

Deno.test("happy: console.log outside server/shared/logger fails no-console", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-console",
      repoRoot,
      "app/features/f1/model/console-bad.ts",
    );
    assertEquals(ds.length, 1);
  });
});

Deno.test("sad: console.log inside server/shared/logger passes no-console", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-console",
      repoRoot,
      "server/shared/logger/console-ok.ts",
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("edge: a call on a differently-cased Console binding passes no-console", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-console",
      repoRoot,
      "app/features/f1/model/console-capital.ts",
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("edge: console.log under tools/cli/ is exempt like tools/cli is a CLI output contract", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-console",
      repoRoot,
      "tools/cli/console-exempt.ts",
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("sad: console.log under tools/lint-plugins/ still fails no-console (no tools/** blanket exemption)", () => {
  withTree((repoRoot) => {
    const ds = diagnosticsFor(
      "semantics/no-console",
      repoRoot,
      "tools/lint-plugins/console-still-caught.ts",
    );
    assertEquals(ds.length, 1);
  });
});

// --- suppression (ratchet) --------------------------------------------------

/** Captures the range of the first declared variable's own identifier -- the
 * same node `no-empty-names` reports at, not the enclosing declaration. */
function captureFirstDeclaratorIdRange(
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
            VariableDeclarator(node) {
              if (node.id.type === "Identifier") captured ??= node.id.range;
            },
          };
        },
      },
    },
  };
  Deno.lint.runPlugin(probe, fileName, source);
  if (!captured) throw new Error("expected a VariableDeclarator in fixture");
  return captured;
}

function noEmptyNamesSite(source: string, fileName: string): ViolationSite {
  const range = captureFirstDeclaratorIdRange(source, fileName);
  return {
    ruleId: "semantics/no-empty-names",
    enclosingFunction: "",
    paramCount: -1,
    bodyFingerprint: fingerprintStatements([{ range }], source),
    sliceKey: null,
  };
}

function writeBaseline(
  repoRoot: string,
  id: string,
  knownPaths: readonly string[],
): void {
  Deno.mkdirSync(`${repoRoot}/tools/baseline`, { recursive: true });
  Deno.writeTextFileSync(
    `${repoRoot}/tools/baseline/baseline.json`,
    JSON.stringify({
      version: 1,
      generatedAt: "2026-08-19T00:00:00Z",
      paths: knownPaths,
      violations: { [id]: 1 },
      perFile: Object.fromEntries(
        knownPaths.map((knownPath) => [knownPath, 1]),
      ),
    }),
  );
}

Deno.test("suppression: a known identity in a known path is silently suppressed", () => {
  withTree((repoRoot) => {
    const relativePath = "app/features/f1/model/bad-name.ts";
    const source = Deno.readTextFileSync(`${repoRoot}/${relativePath}`);
    const site = noEmptyNamesSite(source, `${repoRoot}/${relativePath}`);
    writeBaseline(repoRoot, violationIdentity(site), [relativePath]);
    const ds = diagnosticsFor(
      "semantics/no-empty-names",
      repoRoot,
      relativePath,
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("suppression: a known identity with an unknown path is still reported (new-path zero tolerance)", () => {
  withTree((repoRoot) => {
    const relativePath = "app/features/f1/model/bad-name.ts";
    const source = Deno.readTextFileSync(`${repoRoot}/${relativePath}`);
    const site = noEmptyNamesSite(source, `${repoRoot}/${relativePath}`);
    writeBaseline(repoRoot, violationIdentity(site), [
      "app/features/f1/model/some-other-file.ts",
    ]);
    const ds = diagnosticsFor(
      "semantics/no-empty-names",
      repoRoot,
      relativePath,
    );
    assertEquals(ds.length, 1);
  });
});

/** Same capture technique as `captureFirstDeclaratorIdRange`, generalised to any single node type -- used to prove suppression also gates a resolution-dependent rule, not only a declaration-shape one. */
function captureFirstNodeRange(
  source: string,
  fileName: string,
  nodeType: "MemberExpression",
): readonly [number, number] {
  let captured: readonly [number, number] | undefined;
  const probe: Deno.lint.Plugin = {
    name: "probe",
    rules: {
      capture: {
        create(_context) {
          return { [nodeType]: (node) => captured ??= node.range };
        },
      },
    },
  };
  Deno.lint.runPlugin(probe, fileName, source);
  if (!captured) throw new Error(`expected a ${nodeType} in fixture`);
  return captured;
}

function noDemeterSite(source: string, fileName: string): ViolationSite {
  const range = captureFirstNodeRange(source, fileName, "MemberExpression");
  return {
    ruleId: "semantics/no-demeter",
    enclosingFunction: "",
    paramCount: -1,
    bodyFingerprint: fingerprintStatements([{ range }], source),
    sliceKey: null,
  };
}

Deno.test("suppression: a resolution-dependent rule (no-demeter) is also suppressed by a known identity", () => {
  withTree((repoRoot) => {
    const relativePath = "app/features/f1/model/demeter-bad.ts";
    const source = Deno.readTextFileSync(`${repoRoot}/${relativePath}`);
    const site = noDemeterSite(source, `${repoRoot}/${relativePath}`);
    writeBaseline(repoRoot, violationIdentity(site), [relativePath]);
    const ds = diagnosticsFor("semantics/no-demeter", repoRoot, relativePath);
    assertEquals(ds.length, 0);
  });
});

Deno.test("suppression: no-demeter's known identity still reports on an unknown path (new-path zero tolerance)", () => {
  withTree((repoRoot) => {
    const relativePath = "app/features/f1/model/demeter-bad.ts";
    const source = Deno.readTextFileSync(`${repoRoot}/${relativePath}`);
    const site = noDemeterSite(source, `${repoRoot}/${relativePath}`);
    writeBaseline(repoRoot, violationIdentity(site), [
      "app/features/f1/model/some-other-file.ts",
    ]);
    const ds = diagnosticsFor("semantics/no-demeter", repoRoot, relativePath);
    assertEquals(ds.length, 1);
  });
});

Deno.test("logical-limits: with no baseline present, every semantics rule reports (fail closed)", () => {
  withTree((repoRoot) => {
    const multi = diagnosticsFor(
      "semantics/one-public-export",
      repoRoot,
      "app/features/f1/model/multi.ts",
    );
    const names = diagnosticsFor(
      "semantics/no-empty-names",
      repoRoot,
      "app/features/f1/model/bad-name.ts",
    );
    assertEquals(multi.length, 1);
    assertEquals(names.length, 1);
  });
});

// --- plugin identity ---------------------------------------------------------

Deno.test("logical-limits: the plugin name matches the required pattern", () => {
  withTree((repoRoot) => {
    const plugin = createSemanticsPlugin(repoRoot);
    assert(/^[a-z-]+$/.test(plugin.name));
  });
});
