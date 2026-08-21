import { assertEquals } from "@std/assert";
import { createResolver } from "./specifier-resolve.ts";
import { createEntityOriginTracker } from "./entity-origin.ts";

function writeTree(repoRoot: string, files: Record<string, string>): void {
  for (const [path, content] of Object.entries(files)) {
    const full = `${repoRoot}/${path}`;
    Deno.mkdirSync(full.slice(0, full.lastIndexOf("/")), { recursive: true });
    Deno.writeTextFileSync(full, content);
  }
}

const FIXTURE: Record<string, string> = {
  "deno.json": JSON.stringify({ imports: { "~/": "./app/" } }),
  "app/entities/room/model/room.ts": "export interface Room {}\n",
  "app/features/f1/model/local.ts": "export const local = 1;\n",
  "app/features/f1/model/consumer.ts":
    'import { Room } from "~/entities/room/model/room";\n' +
    'import type { OnlyType } from "~/entities/room/model/room";\n' +
    'import fake from "not-a-real-package";\n' +
    "const local = { a: 1 };\n" +
    "void Room;\nvoid OnlyType;\nvoid fake;\nvoid local;\n",
};

type Tracker = ReturnType<typeof createEntityOriginTracker>;

function captureProbe(
  tracker: Tracker,
  names: readonly string[],
  captured: Record<string, string | null>,
): Deno.lint.Plugin {
  return {
    name: "probe",
    rules: {
      capture: {
        create(context) {
          return {
            Program() {
              for (const name of names) {
                captured[name] = tracker.originOf(context, name);
              }
            },
          };
        },
      },
    },
  };
}

function originsFor(
  repoRoot: string,
  relativePath: string,
  names: readonly string[],
): Record<string, string | null> {
  const tracker = createEntityOriginTracker(
    createResolver(`${repoRoot}/deno.json`),
  );
  const captured: Record<string, string | null> = {};
  const absolute = `${repoRoot}/${relativePath}`;
  const source = Deno.readTextFileSync(absolute);
  Deno.lint.runPlugin(captureProbe(tracker, names, captured), absolute, source);
  return captured;
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

Deno.test("happy: a value-imported local name resolves to its module's absolute path", () => {
  withTree((repoRoot) => {
    const origins = originsFor(
      repoRoot,
      "app/features/f1/model/consumer.ts",
      ["Room"],
    );
    assertEquals(
      origins.Room,
      `${repoRoot}/app/entities/room/model/room.ts`,
    );
  });
});

Deno.test("sad: a locally declared name is not an import and resolves to null", () => {
  withTree((repoRoot) => {
    const origins = originsFor(
      repoRoot,
      "app/features/f1/model/consumer.ts",
      ["local"],
    );
    assertEquals(origins.local, null);
  });
});

Deno.test("edge: a type-only import is excluded from the value-import binding", () => {
  withTree((repoRoot) => {
    const origins = originsFor(
      repoRoot,
      "app/features/f1/model/consumer.ts",
      ["OnlyType"],
    );
    assertEquals(origins.OnlyType, null);
  });
});

Deno.test("edge: a bare specifier with no absolutePath resolves to null, not a bareName string", () => {
  withTree((repoRoot) => {
    const origins = originsFor(
      repoRoot,
      "app/features/f1/model/consumer.ts",
      ["fake"],
    );
    assertEquals(origins.fake, null);
  });
});

Deno.test("logical-limits: an unimported name in any file resolves to null", () => {
  withTree((repoRoot) => {
    const origins = originsFor(
      repoRoot,
      "app/features/f1/model/local.ts",
      ["local", "neverDeclared"],
    );
    assertEquals(origins.local, null);
    assertEquals(origins.neverDeclared, null);
  });
});
