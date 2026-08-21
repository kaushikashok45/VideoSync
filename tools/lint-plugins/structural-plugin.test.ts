import { assertEquals } from "@std/assert";
import { createStructuralPlugin } from "./structural-plugin.ts";
import { describeFunction } from "./shared/function-node.ts";
import { violationIdentity } from "../baseline/identity.ts";
import type { ViolationSite } from "../contracts/identity";
import type { FunctionDescriptor } from "../contracts/function-node";

function withRepo(
  baseline: Record<string, unknown> | null,
  run: (repoRoot: string) => void,
): void {
  const repoRoot = Deno.makeTempDirSync();
  if (baseline) {
    Deno.mkdirSync(`${repoRoot}/tools/baseline`, { recursive: true });
    Deno.writeTextFileSync(
      `${repoRoot}/tools/baseline/baseline.json`,
      JSON.stringify(baseline),
    );
  }
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
  source: string,
): Deno.lint.Diagnostic[] {
  const plugin = createStructuralPlugin(repoRoot);
  const allDiagnostics = Deno.lint.runPlugin(
    plugin,
    `${repoRoot}/${relativePath}`,
    source,
  );
  return allDiagnostics.filter((diagnostic) => diagnostic.id === code);
}

/** Captures the descriptor `structural-plugin` would compute for the first function declaration, using the real parser. */
function captureDescriptor(
  source: string,
  fileName: string,
): FunctionDescriptor {
  let captured: FunctionDescriptor | undefined;
  const probe: Deno.lint.Plugin = {
    name: "probe",
    rules: {
      capture: {
        create(context) {
          return {
            FunctionDeclaration(node) {
              captured ??= describeFunction(node, context.sourceCode);
            },
          };
        },
      },
    },
  };
  Deno.lint.runPlugin(probe, fileName, source);
  if (!captured) {
    throw new Error("expected a FunctionDeclaration in fixture source");
  }
  return captured;
}

const GUARD_PLUS_TERNARY = `
function f(a) {
  if (a) {
    return 1;
  }
  return a ? 1 : 2;
}
`;

Deno.test("happy: complexity 3 in a model/ file fails at the ≤2 logic limit", () => {
  withRepo(null, (repoRoot) => {
    const ds = diagnosticsFor(
      "structural/complexity",
      repoRoot,
      "app/features/chat/model/thing.ts",
      GUARD_PLUS_TERNARY,
    );
    assertEquals(ds.length, 1);
  });
});

Deno.test("happy: complexity 3 in a ui/ .tsx file passes at the ≤4 presentation limit", () => {
  withRepo(null, (repoRoot) => {
    const ds = diagnosticsFor(
      "structural/complexity",
      repoRoot,
      "app/features/chat/ui/Thing.tsx",
      GUARD_PLUS_TERNARY,
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("edge: complexity 3 in a legacy components/ .tsx file passes (migration incentive)", () => {
  withRepo(null, (repoRoot) => {
    const ds = diagnosticsFor(
      "structural/complexity",
      repoRoot,
      "app/routes/legacy/components/Thing.tsx",
      GUARD_PLUS_TERNARY,
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("edge: a .ts file under ui/ is logic, not presentation, so complexity 3 still fails", () => {
  withRepo(null, (repoRoot) => {
    const ds = diagnosticsFor(
      "structural/complexity",
      repoRoot,
      "app/features/chat/ui/helpers.ts",
      GUARD_PLUS_TERNARY,
    );
    assertEquals(ds.length, 1);
  });
});

Deno.test("edge: a tools/** file gets the carve-out ≤4 limit despite being logic", () => {
  withRepo(null, (repoRoot) => {
    const ds = diagnosticsFor(
      "structural/complexity",
      repoRoot,
      "tools/cli/some-script.ts",
      GUARD_PLUS_TERNARY,
    );
    assertEquals(ds.length, 0);
  });
});

const NESTED_CALLBACK_EXCEEDING_LIMIT = `
function parent() {
  const cb = () => {
    if (a) {
      return 1;
    }
    return a ? 1 : 2;
  };
  return cb;
}
`;

/** The diagnostic's range must fall within the arrow, strictly after the parent function's own opening -- proving it was attributed to the callback's frame, not folded into the parent's. */
function assertDiagnosticAttributedToCallback(
  diagnostics: Deno.lint.Diagnostic[],
  source: string,
): void {
  assertEquals(diagnostics.length, 1);
  const arrowStart = source.indexOf("() => {");
  const parentStart = source.indexOf("function parent");
  assertEquals(diagnostics[0].range[0] >= arrowStart, true);
  assertEquals(diagnostics[0].range[0] > parentStart, true);
}

Deno.test("mutation-guard: a nested callback exceeding the limit is attributed to the callback, not its compliant parent", () => {
  withRepo(null, (repoRoot) => {
    const ds = diagnosticsFor(
      "structural/complexity",
      repoRoot,
      "app/features/chat/model/thing.ts",
      NESTED_CALLBACK_EXCEEDING_LIMIT,
    );
    assertDiagnosticAttributedToCallback(ds, NESTED_CALLBACK_EXCEEDING_LIMIT);
  });
});

Deno.test("happy: a ?? b counts as a decision point", () => {
  const source = `
function f(a, b, c) {
  const x = a ?? b;
  if (c) {
    return 1;
  }
  return x;
}
`;
  withRepo(null, (repoRoot) => {
    // base 1 + ?? (1) + if (1) = 3, exceeds the ≤2 logic limit.
    const ds = diagnosticsFor(
      "structural/complexity",
      repoRoot,
      "app/features/chat/model/thing.ts",
      source,
    );
    assertEquals(ds.length, 1);
  });
});

Deno.test("happy: a plain else adds nothing to complexity", () => {
  const source = `
function f(a) {
  if (a) {
    return 1;
  } else {
    return 2;
  }
}
`;
  withRepo(null, (repoRoot) => {
    // base 1 + if (1) = 2, at the ≤2 logic limit exactly.
    const ds = diagnosticsFor(
      "structural/complexity",
      repoRoot,
      "app/features/chat/model/thing.ts",
      source,
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("happy: a single destructured object parameter counts as exactly 1", () => {
  const source = `
function f({ a, b, c, d, e }) {
  return a;
}
`;
  withRepo(null, (repoRoot) => {
    const ds = diagnosticsFor(
      "structural/param-count",
      repoRoot,
      "app/features/chat/model/thing.ts",
      source,
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("happy: 5 plain parameters exceeds the ≤4 limit", () => {
  const source = `
function f(a, b, c, d, e) {
  return a;
}
`;
  withRepo(null, (repoRoot) => {
    const ds = diagnosticsFor(
      "structural/param-count",
      repoRoot,
      "app/features/chat/model/thing.ts",
      source,
    );
    assertEquals(ds.length, 1);
  });
});

Deno.test("sad: 4 parameters is a compliant near-miss", () => {
  const source = `
function f(a, b, c, d) {
  return a;
}
`;
  withRepo(null, (repoRoot) => {
    const ds = diagnosticsFor(
      "structural/param-count",
      repoRoot,
      "app/features/chat/model/thing.ts",
      source,
    );
    assertEquals(ds.length, 0);
  });
});

function nLineSource(lineCount: number): string {
  return Array.from(
    { length: lineCount },
    (_element, lineIndex) => `const v${lineIndex} = ${lineIndex};`,
  ).join("\n") + "\n";
}

function lines(lineCount: number): string {
  return Array.from(
    { length: lineCount },
    (_element, lineIndex) => `  const v${lineIndex} = ${lineIndex};`,
  ).join("\n");
}

Deno.test("happy: a 21-line function body exceeds the ≤20 limit", () => {
  const source = `function big() {\n${lines(21)}\n}\n`;
  withRepo(null, (repoRoot) => {
    const ds = diagnosticsFor(
      "structural/body-length",
      repoRoot,
      "app/features/chat/model/thing.ts",
      source,
    );
    assertEquals(ds.length, 1);
  });
});

Deno.test("sad: a 20-line function body is a compliant near-miss", () => {
  const source = `function big() {\n${lines(20)}\n}\n`;
  withRepo(null, (repoRoot) => {
    const ds = diagnosticsFor(
      "structural/body-length",
      repoRoot,
      "app/features/chat/model/thing.ts",
      source,
    );
    assertEquals(ds.length, 0);
  });
});

const DEEP_NESTING_THREE_LEVELS = `
function deep(a, b, c) {
  if (a) {
    if (b) {
      if (c) {
        return 1;
      }
    }
  }
  return 0;
}
`;

Deno.test("happy: nesting 3 levels deep exceeds the ≤2 limit past the function body", () => {
  withRepo(null, (repoRoot) => {
    const ds = diagnosticsFor(
      "structural/nesting-depth",
      repoRoot,
      "app/features/chat/model/thing.ts",
      DEEP_NESTING_THREE_LEVELS,
    );
    assertEquals(ds.length, 1);
  });
});

Deno.test("sad: nesting exactly 2 levels deep is a compliant near-miss", () => {
  const source = `
function deep(a, b) {
  if (a) {
    if (b) {
      return 1;
    }
  }
  return 0;
}
`;
  withRepo(null, (repoRoot) => {
    const ds = diagnosticsFor(
      "structural/nesting-depth",
      repoRoot,
      "app/features/chat/model/thing.ts",
      source,
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("happy: a 200-line file exceeds the ≤150 limit", () => {
  const source = nLineSource(200);
  withRepo(null, (repoRoot) => {
    const ds = diagnosticsFor(
      "structural/file-length",
      repoRoot,
      "app/features/chat/model/thing.ts",
      source,
    );
    assertEquals(ds.length, 1);
  });
});

Deno.test("sad: a 100-line file is a compliant near-miss", () => {
  const source = nLineSource(100);
  withRepo(null, (repoRoot) => {
    const ds = diagnosticsFor(
      "structural/file-length",
      repoRoot,
      "app/features/chat/model/thing.ts",
      source,
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("edge: a path outside every known root is not a violation", () => {
  withRepo(null, (repoRoot) => {
    const ds = diagnosticsFor(
      "structural/complexity",
      repoRoot,
      "scripts/smoke.sh.ts",
      GUARD_PLUS_TERNARY,
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("edge: a 200-line test-role file passes file-length (test exemption)", () => {
  const source = nLineSource(200);
  withRepo(null, (repoRoot) => {
    const ds = diagnosticsFor(
      "structural/file-length",
      repoRoot,
      "app/features/chat/model/thing.test.ts",
      source,
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("edge: a 200-line non-test file in the same directory still fails file-length", () => {
  const source = nLineSource(200);
  withRepo(null, (repoRoot) => {
    const ds = diagnosticsFor(
      "structural/file-length",
      repoRoot,
      "app/features/chat/model/thing.ts",
      source,
    );
    assertEquals(ds.length, 1);
  });
});

function complexityViolationIdFor(
  repoRoot: string,
  relativePath: string,
): string {
  const descriptor = captureDescriptor(
    GUARD_PLUS_TERNARY,
    `${repoRoot}/${relativePath}`,
  );
  const site: ViolationSite = {
    ruleId: "structural/complexity",
    enclosingFunction: descriptor.name,
    paramCount: descriptor.paramCount,
    bodyFingerprint: descriptor.bodyFingerprint,
    sliceKey: null,
  };
  return violationIdentity(site);
}

function writeBaselineFile(
  repoRoot: string,
  options: {
    readonly paths: readonly string[];
    readonly id: string;
    readonly perFile: Record<string, number>;
  },
): void {
  Deno.mkdirSync(`${repoRoot}/tools/baseline`, { recursive: true });
  Deno.writeTextFileSync(
    `${repoRoot}/tools/baseline/baseline.json`,
    JSON.stringify({
      version: 1,
      generatedAt: "2026-08-19T00:00:00Z",
      paths: options.paths,
      violations: { [options.id]: 1 },
      perFile: options.perFile,
    }),
  );
}

Deno.test("suppression: a violation whose identity is in the baseline is silently suppressed", () => {
  const relativePath = "app/features/chat/model/thing.ts";
  withRepo(null, (repoRoot) => {
    const id = complexityViolationIdFor(repoRoot, relativePath);
    writeBaselineFile(repoRoot, {
      paths: [relativePath],
      id,
      perFile: { [relativePath]: 1 },
    });
    const ds = diagnosticsFor(
      "structural/complexity",
      repoRoot,
      relativePath,
      GUARD_PLUS_TERNARY,
    );
    assertEquals(ds.length, 0);
  });
});

Deno.test("suppression: the same identity is reported when its path is absent from the baseline (new-path zero tolerance)", () => {
  const relativePath = "app/features/chat/model/thing.ts";
  withRepo(null, (repoRoot) => {
    const id = complexityViolationIdFor(repoRoot, relativePath);
    writeBaselineFile(repoRoot, {
      paths: ["app/features/chat/model/some-other-file.ts"],
      id,
      perFile: {},
    });
    const ds = diagnosticsFor(
      "structural/complexity",
      repoRoot,
      relativePath,
      GUARD_PLUS_TERNARY,
    );
    assertEquals(ds.length, 1);
  });
});

Deno.test("logical-limits: with no baseline file present, every rule reports (fail closed)", () => {
  withRepo(null, (repoRoot) => {
    const complexity = diagnosticsFor(
      "structural/complexity",
      repoRoot,
      "app/features/chat/model/thing.ts",
      GUARD_PLUS_TERNARY,
    );
    const params = diagnosticsFor(
      "structural/param-count",
      repoRoot,
      "app/features/chat/model/thing.ts",
      `function f(a, b, c, d, e) { return a; }\n`,
    );
    assertEquals(complexity.length, 1);
    assertEquals(params.length, 1);
  });
});
